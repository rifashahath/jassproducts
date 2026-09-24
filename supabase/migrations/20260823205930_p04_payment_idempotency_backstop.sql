-- =============================================================================
-- P0-4 — Database backstop for payment idempotency
--
-- Context
--   `public.orders.payment_id` is declared as a bare `payment_id TEXT` in both
--   production_master_migration.sql and production_remediation_migration.sql, with
--   no unique constraint or index. That makes the application-level duplicate check
--   in api/verify-razorpay-payment.ts the ONLY thing standing between a replayed
--   verification request and two order rows for one captured payment.
--
--   The application check has been corrected (it now keys on payment_id alone and
--   fails closed on a lookup error), but a single application-level check is not a
--   sufficient guarantee: two concurrent verification requests for the same payment
--   can both pass the SELECT before either INSERT lands. Only the database can
--   settle that race.
--
-- Run order
--   Run STEP 1 on its own and read the result before running STEP 2.
--   STEP 2 will fail outright if duplicates already exist — by design. A failure
--   there is a finding, not a problem with this script.
--
-- Safety
--   STEP 1 is read-only. STEP 2 adds an index and does not modify, delete, or
--   rewrite any row.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1 (read-only) — Has any payment already been recorded more than once?
--
-- Every row returned here is one Razorpay payment that produced multiple order
-- rows: either a genuine double-processing incident, or a retry that slipped past
-- the old `.or()` duplicate check. Reconcile these against the Razorpay dashboard
-- and delete or merge the surplus rows BEFORE running STEP 2.
--
-- Expected result on a healthy database: 0 rows.
-- -----------------------------------------------------------------------------
SELECT
  payment_id,
  COUNT(*)                              AS order_count,
  ARRAY_AGG(id ORDER BY created_at)     AS order_ids,
  ARRAY_AGG(total ORDER BY created_at)  AS totals,
  MIN(created_at)                       AS first_seen,
  MAX(created_at)                       AS last_seen
FROM public.orders
WHERE payment_id IS NOT NULL
  AND payment_id <> ''
GROUP BY payment_id
HAVING COUNT(*) > 1
ORDER BY order_count DESC, last_seen DESC;


-- -----------------------------------------------------------------------------
-- STEP 2 — Enforce one order per captured payment.
--
-- Partial index: orders with no payment_id (cash on delivery, manually created,
-- or pending) are unconstrained. Postgres permits multiple NULLs in a unique
-- index anyway; the predicate also excludes the empty string, which a plain
-- unique index would treat as a real duplicate-able value.
--
-- Run this ONLY after STEP 1 returns zero rows.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique
  ON public.orders (payment_id)
  WHERE payment_id IS NOT NULL AND payment_id <> '';

COMMENT ON INDEX public.orders_payment_id_unique IS
  'One order row per Razorpay payment_id. Backstop for the idempotency check in '
  'api/verify-razorpay-payment.ts: prevents two concurrent verification requests '
  'for the same payment from both inserting.';


-- -----------------------------------------------------------------------------
-- STEP 2 (alternative) — if public.orders is large enough that a brief write
-- lock matters, use the non-blocking form instead of the STEP 2 above.
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block, so execute
-- this statement completely on its own, not as part of a multi-statement script:
--
--   CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS orders_payment_id_unique
--     ON public.orders (payment_id)
--     WHERE payment_id IS NOT NULL AND payment_id <> '';
--
-- If it fails it can leave an INVALID index behind; drop it before retrying:
--
--   DROP INDEX IF EXISTS public.orders_payment_id_unique;
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- STEP 3 (read-only) — Confirm the index exists and is valid.
-- Expect exactly one row, with is_valid = true.
-- -----------------------------------------------------------------------------
SELECT
  i.relname   AS index_name,
  idx.indisunique AS is_unique,
  idx.indisvalid  AS is_valid,
  pg_get_expr(idx.indpred, idx.indrelid) AS partial_predicate
FROM pg_class i
JOIN pg_index idx ON idx.indexrelid = i.oid
JOIN pg_class t   ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'orders'
  AND i.relname = 'orders_payment_id_unique';


-- =============================================================================
-- Application note — what the handler will do once this index exists
--
--   On the losing side of a concurrent race, the INSERT (or the
--   process_order_atomic RPC) now fails with SQLSTATE 23505 (unique_violation)
--   instead of silently creating a second order. api/verify-razorpay-payment.ts
--   currently surfaces that as a 409 with the database message.
--
--   That is correct and safe — no duplicate is created — but it is not yet the
--   ideal response: the truly correct behaviour on 23505 against
--   orders_payment_id_unique is to re-read the winning row and return the same
--   idempotent 200 the first request returned. That refinement is deliberately
--   NOT included here, because it is an application change that should be made
--   and tested against an index that actually exists. Revisit it after STEP 2
--   has been applied.
-- =============================================================================
