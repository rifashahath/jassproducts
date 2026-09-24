/**
 * Atomic single-product stock adjustment for the serverless handlers.
 *
 * `process_order_atomic` and `cancel_order_restore_stock` do this correctly in the
 * database: `SELECT … FOR UPDATE`, check, write, log, all inside one transaction. Both
 * handlers keep a JavaScript fallback for the case where those functions are missing
 * from the schema cache, and those fallbacks were read-modify-write with no lock, no
 * conflict detection, and no error checking. Measured against that code:
 *
 *   - Two orders for the same product, real stock 10, one unit each: both computed
 *     `10 - 1` and both wrote the absolute value `9`. Two units sold, one decremented.
 *   - The verify handler took `previous_stock` from a catalogue read taken several
 *     round trips earlier, and fell back to a hardcoded `50` when the line had resolved
 *     from the static seed. It then wrote `50 - qty` as an absolute value over whatever
 *     the row actually held — inventing stock, and reverting any concurrent decrement.
 *   - A rejected write (verified with SQLSTATE 42501) was discarded entirely: the
 *     handler returned `200 {success: true}` and still inserted an `inventory_logs` row
 *     describing a movement that had not happened.
 *
 * Every write below is a compare-and-swap: the `UPDATE` carries the stock value the
 * decision was based on in its own `WHERE` clause, so Postgres matches zero rows if
 * another writer moved it first. A lost update becomes a detected conflict, which is
 * retried against a fresh read. This deliberately depends on no database function,
 * because the only reason this code runs is that the database functions are absent.
 */

/** Minimal Postgrest-shaped error, so this module stays transport-agnostic. */
export interface StockPostgrestError {
  message: string;
}

export interface StockResult<Row> {
  data: Row | null;
  error: StockPostgrestError | null;
}

export interface StockSelectQuery<Row> {
  eq(column: string, value: unknown): StockSelectQuery<Row>;
  single(): PromiseLike<StockResult<Row>>;
  maybeSingle(): PromiseLike<StockResult<Row>>;
}

export interface StockUpdateQuery {
  eq(column: string, value: unknown): StockUpdateQuery;
  select(columns?: string): PromiseLike<StockResult<unknown[]>>;
}

/** The one shape this module needs; keeps it usable with a test double. */
export interface StockClient {
  from(table: string): {
    select(columns?: string): StockSelectQuery<{ stock?: number | null }>;
    update(values: Record<string, unknown>): StockUpdateQuery;
    insert(values: Record<string, unknown>): PromiseLike<StockResult<null>>;
  };
}

export type StockFailureReason =
  /** `delta` was not a usable non-zero integer — a caller bug, not a data condition. */
  | "invalid_request"
  /** No such product row. Not the same as "stock is zero". */
  | "not_found"
  /** The row exists but does not hold enough to satisfy a negative delta. */
  | "insufficient_stock"
  /** Lost every compare-and-swap race within the attempt budget. */
  | "contention"
  /** The current stock could not be read, so no decision could be made. */
  | "read_failed"
  /** The write itself was rejected by the database. */
  | "write_failed";

export interface StockAdjustment {
  productId: string;
  /** Negative to sell, positive to restore. */
  delta: number;
  /** `inventory_logs.type`, e.g. `"SALE"` or `"RESTORE"`. */
  type: string;
  /** Human-readable provenance for the audit row. */
  reason: string;
}

export type StockAdjustOutcome =
  | {
      ok: true;
      productId: string;
      previousStock: number;
      newStock: number;
      attempts: number;
      /** False when the movement happened but its audit row could not be written. */
      auditLogged: boolean;
    }
  | {
      ok: false;
      productId: string;
      reason: StockFailureReason;
      attempts: number;
      /** Present on `insufficient_stock`: what the row actually held. */
      available?: number;
      detail?: string;
    };

/**
 * Bounded so a hot row cannot hold a serverless function open until the platform kills
 * it. Five losses in a row means sustained contention, which is a condition to report
 * rather than to keep absorbing.
 */
export const MAX_STOCK_CAS_ATTEMPTS = 5;

export async function adjustProductStock(
  client: StockClient,
  adjustment: StockAdjustment,
  maxAttempts: number = MAX_STOCK_CAS_ATTEMPTS,
): Promise<StockAdjustOutcome> {
  const { productId, delta, type, reason } = adjustment;

  if (!productId || !Number.isInteger(delta) || delta === 0) {
    return {
      ok: false,
      productId,
      reason: "invalid_request",
      attempts: 0,
      detail: `delta must be a non-zero integer, received ${String(delta)}`,
    };
  }

  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    // Read immediately before deciding. The previous code reused a snapshot taken
    // earlier in the request, which is what made the write an absolute value derived
    // from stale data.
    const { data: row, error: readError } = await client
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();

    if (readError) {
      return {
        ok: false,
        productId,
        reason: "read_failed",
        attempts,
        detail: readError.message,
      };
    }

    if (!row) {
      return { ok: false, productId, reason: "not_found", attempts };
    }

    // A null or non-numeric stock cannot be compared-and-swapped — `stock = NULL` never
    // matches — so report it instead of coercing to 0 and writing over a real value.
    if (row.stock === null || row.stock === undefined) {
      return {
        ok: false,
        productId,
        reason: "read_failed",
        attempts,
        detail: "products.stock is null; cannot adjust safely",
      };
    }

    const observed = Number(row.stock);
    if (!Number.isFinite(observed)) {
      return {
        ok: false,
        productId,
        reason: "read_failed",
        attempts,
        detail: `products.stock is not numeric: ${String(row.stock)}`,
      };
    }

    const nextStock = observed + delta;

    if (nextStock < 0) {
      // Refused rather than clamped. The previous code applied `Math.max(0, …)`, which
      // turned an oversell into a silent write of 0 and lost the fact that it happened.
      return {
        ok: false,
        productId,
        reason: "insufficient_stock",
        attempts,
        available: observed,
      };
    }

    // The compare-and-swap. `.eq("stock", observed)` makes the write conditional on the
    // value the decision above was based on, so a concurrent change means zero rows
    // match rather than one row being overwritten. `.select("id")` is what makes the
    // outcome observable — without it PostgREST returns no representation and a lost
    // race is indistinguishable from a win.
    const { data: updated, error: writeError } = await client
      .from("products")
      .update({
        stock: nextStock,
        in_stock: nextStock > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("stock", observed)
      .select("id");

    if (writeError) {
      return {
        ok: false,
        productId,
        reason: "write_failed",
        attempts,
        detail: writeError.message,
      };
    }

    if (!Array.isArray(updated) || updated.length === 0) {
      // Another writer moved this row between the read and the write. Retry against a
      // fresh read; the stock check above is re-evaluated on the new value.
      continue;
    }

    // Only now is the movement a fact, so only now is it audited — with the values
    // actually observed and written, never assumed ones.
    const { error: logError } = await client.from("inventory_logs").insert({
      product_id: productId,
      quantity_change: delta,
      previous_stock: observed,
      new_stock: nextStock,
      type,
      reason,
      created_at: new Date().toISOString(),
    });

    // A failed audit insert is reported but does not fail the adjustment. The stock has
    // already moved; returning failure would invite the caller to retry and move it
    // twice. Losing an audit row is the lesser of those two outcomes.
    return {
      ok: true,
      productId,
      previousStock: observed,
      newStock: nextStock,
      attempts,
      auditLogged: !logError,
    };
  }

  return { ok: false, productId, reason: "contention", attempts };
}

/** One-line summary for a log line, so both handlers describe failures identically. */
export function describeStockFailure(outcome: Extract<StockAdjustOutcome, { ok: false }>): string {
  const base = `product ${outcome.productId}: ${outcome.reason} after ${outcome.attempts} attempt(s)`;
  if (outcome.reason === "insufficient_stock") {
    return `${base} (available: ${outcome.available})`;
  }
  return outcome.detail ? `${base} — ${outcome.detail}` : base;
}
