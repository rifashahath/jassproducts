import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  adjustProductStock,
  describeStockFailure,
  type StockClient,
} from "../src/lib/stock-ledger.ts";
import { evaluateCancellationPermissions } from "../src/lib/cancellation-authorization.ts";
import { isAdminRole } from "../src/lib/roles.ts";
import { checkRateLimit, rateLimitResponse } from "./_rate-limit.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Could not create Supabase client:", err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // State-changing and authenticated. Keyed by the bearer token so a stolen
  // token cannot be used to spam cancellations, and small enough that a
  // runaway client loop cannot churn stock.
  const rl = checkRateLimit(`cancel-order:${req.headers?.authorization || "anon"}`, 5, 60 * 1000);
  if (!rl.allowed) {
    console.warn("Rate limit hit on cancel-order, retry after", rl.retryAfterSeconds, "s");
    return rateLimitResponse(res, rl);
  }

  try {
    const authHeader = req.headers?.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: Missing or invalid Authorization header. Bearer token required.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Authentication token is empty." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration error. Please contact support." });
    }

    // 1. Authenticate caller via Supabase GoTrue Auth
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired authentication token.",
      });
    }

    const caller = userData.user;
    const { orderId, reason } = req.body || {};

    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
      return res.status(400).json({ error: "Missing required orderId parameter." });
    }

    // 2. Fetch order to verify ownership and lifecycle state
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, user_email, status, items")
      .eq("id", orderId.trim())
      .maybeSingle();

    if (fetchError || !order) {
      return res.status(404).json({ error: `Order '${orderId}' not found.` });
    }

    // 3. Fetch server-side profile role (if needed for admin verification)
    let dbRole: string | undefined = undefined;
    if (!isAdminRole(caller.app_metadata?.role)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", caller.id)
        .maybeSingle();
      if (profile) {
        dbRole = profile.role;
      }
    }

    // 4. Enforce strict authorization & state machine checks
    const authCheck = evaluateCancellationPermissions(
      { id: caller.id, email: caller.email, app_metadata: caller.app_metadata },
      order,
      dbRole
    );

    if (!authCheck.allowed) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    // Same shared vocabulary as the authorization above, so the reason string cannot say
    // "Customer" for a caller the evaluator just treated as an administrator.
    const isCallerAdmin = isAdminRole(caller.app_metadata?.role) || isAdminRole(dbRole);

    // Populated only when the order was cancelled but its stock could not be returned.
    // Declared out here so the response can distinguish that from a clean cancellation
    // instead of asserting "stock restored" either way.
    const stockWarnings: string[] = [];

    // 5. Atomic Order Cancellation & Stock Restoration RPC
    const { error: rpcError } = await supabase.rpc("cancel_order_restore_stock", {
      p_order_id: orderId.trim(),
      p_reason: reason || `Cancelled by ${isCallerAdmin ? "Administrator" : "Customer"}`,
    });

    if (rpcError) {
      // If RPC is missing in schema cache, execute server-side fallback
      if (rpcError.message && (rpcError.message.includes("cancel_order_restore_stock") || rpcError.message.includes("schema cache"))) {
        // The status transition doubles as this cancellation's mutex. `.neq` makes the
        // write conditional on the order not already being cancelled, and `.select()`
        // reports whether it matched — so of two requests that race past the state check
        // in step 4 together, exactly one goes on to restore stock. Without the guard
        // both would, crediting the product twice for a single cancellation.
        const { data: transitioned, error: updateError } = await supabase
          .from("orders")
          .update({
            status: "CANCELLED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId.trim())
          .neq("status", "CANCELLED")
          .select("id");

        if (updateError) {
          console.error("Order status update failed:", updateError);
          return res.status(500).json({ error: "Failed to update order status in database." });
        }

        const wonTransition = Array.isArray(transitioned) && transitioned.length > 0;

        // No rows matched means a concurrent request cancelled it first. The order is
        // cancelled either way, so this is still a success — but that request already
        // restored the stock, so doing it again would inflate inventory.
        if (wonTransition && Array.isArray(order.items) && order.items.length > 0) {
          const stockFailures: string[] = [];

          for (const item of order.items) {
            const pId = item?.id || item?.productId;
            const qty = Math.trunc(Number(item?.qty ?? item?.quantity)) || 1;
            if (!pId) continue;

            // Compare-and-swap against a fresh read — see src/lib/stock-ledger.ts. The
            // previous revision read stock, added to it, and wrote the result as an
            // absolute value with every error discarded. Verified against that code: two
            // concurrent cancellations covering the same product each wrote the same
            // value, losing one restore; and a write rejected with SQLSTATE 42501 still
            // returned `200 {success: true}` with the message "successfully cancelled and
            // stock restored", plus an inventory_logs row claiming the movement happened.
            const outcome = await adjustProductStock(supabase as unknown as StockClient, {
              productId: String(pId),
              delta: qty,
              type: "RESTORE",
              reason: `Order cancelled: ${orderId.trim()}`,
            });

            if (!outcome.ok) {
              stockFailures.push(describeStockFailure(outcome));
            } else if (!outcome.auditLogged) {
              console.warn(
                `Stock restored for product ${pId} but its inventory_logs row was not written (order ${orderId.trim()}).`
              );
            }
          }

          if (stockFailures.length > 0) {
            // The cancellation stands — reversing it would be worse for the customer
            // than an inventory correction. Logged under a fixed marker so a log drain
            // can alert on it, and surfaced in the response rather than reported as
            // "stock restored" when it was not.
            console.error(
              "STOCK_RECONCILIATION_REQUIRED",
              JSON.stringify({
                orderId: orderId.trim(),
                operation: "cancellation_restore",
                failures: stockFailures,
              })
            );
            stockWarnings.push(
              "Inventory for this cancellation requires manual reconciliation.",
              ...stockFailures
            );
          }
        }
      } else {
        console.error("Order cancellation RPC error:", rpcError);
        return res.status(409).json({ error: rpcError.message });
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderId.trim(),
      status: "CANCELLED",
      message:
        stockWarnings.length > 0
          ? `Order ${orderId} cancelled. Inventory requires manual reconciliation.`
          : `Order ${orderId} successfully cancelled and stock restored.`,
      ...(stockWarnings.length > 0 ? { stockWarnings } : {}),
    });
  } catch (error: any) {
    console.error("Server cancellation handler error:", error);
    return res.status(500).json({ error: "Internal server error during order cancellation." });
  }
}
