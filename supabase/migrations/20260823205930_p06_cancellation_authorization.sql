-- =====================================================================
-- P0-6 / C-5 : Order cancellation authorization
-- =====================================================================
-- Fixes a missing-authorization defect in public.cancel_order_restore_stock and removes
-- the direct route to it.
--
-- MEASURED, against the function body currently in
-- supabase/production_remediation_migration.sql (lines 421-521):
--
--   IF (v_order.user_id IS NOT NULL AND v_order.user_id != auth.uid())
--      AND NOT public.is_admin() THEN
--     RAISE EXCEPTION 'Access Denied: ...';
--   END IF;
--
-- When user_id IS NULL the first conjunct is false, so the whole condition is false and
-- no exception is raised. Every order with no user_id was cancellable by ANY
-- authenticated caller. Two things make that reachable:
--
--   1. The function is SECURITY DEFINER (it bypasses RLS) and was
--      GRANT EXECUTE ... TO authenticated, so any signed-in user could call
--      POST /rest/v1/rpc/cancel_order_restore_stock directly with the public anon key
--      and their own JWT, never touching /api/cancel-order or its ownership check.
--   2. orders.user_id is "UUID REFERENCES auth.users(id) ON DELETE SET NULL", so
--      deleting an account converts all of its past orders into that same unowned class.
--
-- Impact: cancel another customer's order, flipping status to CANCELLED and crediting
-- stock back. Lost revenue and corrupted order state, with no audit trail attributing it
-- to the caller. The function also raises a distinct 'Order "%" not found' for unknown
-- ids, so it doubles as an existence oracle for order references.
--
-- NOT VERIFIED: whether these grants are what is actually deployed. This repository
-- contains three migration files that disagree, and production_master_migration.sql does
-- not define this function at all. Run STEP 1 to see the live state before applying
-- anything. If the function is absent, only STEP 3 matters and the handlers use their
-- (now compare-and-swap) JavaScript fallback.
--
-- Two further notes on scope:
--   * This script preserves the rest of the body byte-for-byte from
--     production_remediation_migration.sql, including inventory_logs.type =
--     'CANCEL_RESTORE'. supabase/phase3_database_drift_and_atomicity.sql carries an
--     otherwise-identical function that writes 'RESTORE' instead. That drift is real but
--     nothing in the application filters on this value, so it is left as found rather
--     than silently normalised here.
--   * The API handler's own predicate is fixed separately in api/cancel-order.ts.
--
-- SAFE TO RE-RUN. STEP 1 is read-only; run it first.
-- =====================================================================


-- ---------------------------------------------------------------------
-- STEP 1 - READ ONLY. Run this alone and read the output before STEP 2.
-- ---------------------------------------------------------------------

-- 1a. Does the function exist, and who can execute it right now?
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef                               AS is_security_definer,
  COALESCE(
    (SELECT string_agg(DISTINCT g.grantee, ', ' ORDER BY g.grantee)
     FROM information_schema.routine_privileges g
     WHERE g.specific_schema = 'public'
       AND g.routine_name = p.proname
       AND g.privilege_type = 'EXECUTE'),
    '(none)'
  ) AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'cancel_order_restore_stock';

-- 1b. How many orders are currently in the unowned, cancellable-by-anyone class?
--     Rows counted here are the exposure. A non-zero count with 'authenticated' listed
--     in 1a above means the defect is live.
SELECT
  count(*)                                                   AS unowned_orders_total,
  count(*) FILTER (WHERE upper(coalesce(status,'')) NOT IN
                         ('CANCELLED','DELIVERED','SHIPPED')) AS still_cancellable
FROM public.orders
WHERE user_id IS NULL;


-- ---------------------------------------------------------------------
-- STEP 2 - Replace the function with a correct authorization predicate.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_restore_stock(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Cancelled via API'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- 1. Acquire row lock on order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order "%" not found', p_order_id;
  END IF;

  -- 2. Strict Authorization Check (Defends against BOLA / IDOR)
  --
  -- The previous predicate was
  --   IF (v_order.user_id IS NOT NULL AND v_order.user_id != auth.uid()) AND NOT is_admin()
  -- which raises nothing when user_id IS NULL. Every order with no user_id was therefore
  -- cancellable by any authenticated caller, and because this function is SECURITY
  -- DEFINER and was granted to `authenticated`, it was reachable directly over PostgREST
  -- without going through /api/cancel-order at all. orders.user_id is also
  -- ON DELETE SET NULL, so a deleted account turns its past orders into that same class.
  --
  -- COALESCE because auth.role() reads a request-scoped JWT claim and is NULL outside a
  -- PostgREST request. `NULL != 'service_role'` is NULL, and an SQL IF does not fire on
  -- NULL, so the original guard was skipped in that context and the function continued —
  -- fail-open. Coalescing to '' makes such a context fall through to the auth.uid() check
  -- and be refused.
  --
  -- is_admin() is deliberately NOT hoisted into the outer condition. Doing so lets an
  -- admin bypass the auth.uid() NULL check as well; that is unreachable today only
  -- because is_admin() returns false whenever auth.uid() IS NULL, and this predicate
  -- should not depend on that coupling holding in a future revision of is_admin().
  IF COALESCE(auth.role(), '') != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to cancel order';
    END IF;

    IF NOT public.is_admin() THEN
      -- An order with no user_id has no owner in the auth system, so no authenticated
      -- caller can be shown to own it here. Ownership for those rests on the email
      -- recorded at checkout, which only the API handler can evaluate; this path cannot,
      -- so it refuses instead of guessing.
      IF v_order.user_id IS NULL THEN
        RAISE EXCEPTION 'Access Denied: Guest orders must be cancelled through the store API';
      END IF;

      IF v_order.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access Denied: You do not have permission to cancel this order';
      END IF;
    END IF;
  END IF;

  -- 3. Lifecycle State Validation
  IF UPPER(COALESCE(v_order.status, '')) = 'CANCELLED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order is already cancelled',
      'order_id', p_order_id
    );
  END IF;

  IF UPPER(COALESCE(v_order.status, '')) IN ('DELIVERED', 'SHIPPED') THEN
    RAISE EXCEPTION 'Cannot cancel an order with status "%"', v_order.status;
  END IF;

  -- 4. Restore stock atomically for all line items
  FOR v_item IN 
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
    UNION
    SELECT (item->>'id')::TEXT as product_id, (item->>'qty')::INTEGER as quantity 
    FROM jsonb_array_elements(v_order.items) AS item
    WHERE NOT EXISTS (SELECT 1 FROM public.order_items WHERE order_id = p_order_id)
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.quantity > 0 THEN
      SELECT stock INTO v_current_stock
      FROM public.products
      WHERE id = v_item.product_id
      FOR UPDATE;

      IF FOUND THEN
        v_new_stock := v_current_stock + v_item.quantity;
        UPDATE public.products
        SET stock = v_new_stock,
            in_stock = true,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item.product_id;

        INSERT INTO public.inventory_logs (
          id, product_id, quantity_change, previous_stock, new_stock, type, reason
        ) VALUES (
          gen_random_uuid()::text,
          v_item.product_id,
          v_item.quantity,
          v_current_stock,
          v_new_stock,
          'CANCEL_RESTORE',
          'Order Cancelled Restock: ' || p_order_id || ' (' || COALESCE(p_reason, 'Restock') || ')'
        );
      END IF;
    END IF;
  END LOOP;

  -- 5. Update order status
  UPDATE public.orders
  SET status = 'CANCELLED',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'CANCELLED',
    'message', 'Order successfully cancelled and stock restored.'
  );
END;
$$;

-- Revoke from public/anon and grant only to authenticated and service_role


-- ---------------------------------------------------------------------
-- STEP 3 - Remove the direct route to it.
-- ---------------------------------------------------------------------
-- Verified before writing this: no client code calls .rpc() at all. Cancellation goes
-- exclusively through fetch("/api/cancel-order")
-- (src/features/admin/orders/store/admin-orders-store.ts:221), which uses a server-side
-- key. Revoking from `authenticated` therefore removes the bypass without removing any
-- path the application actually uses.
--
-- PREREQUISITE: api/cancel-order.ts falls back to VITE_SUPABASE_ANON_KEY when
-- SUPABASE_SERVICE_ROLE_KEY is unset. On the anon key this RPC is already denied (anon
-- was revoked previously), so the handler already takes its JavaScript fallback. Set
-- SUPABASE_SERVICE_ROLE_KEY in Vercel to get the atomic in-database path back.
REVOKE EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) TO service_role;


-- ---------------------------------------------------------------------
-- STEP 4 - VERIFY. Re-run STEP 1a: can_execute should now read only
--          'service_role' (plus the function owner, which is expected).
-- ---------------------------------------------------------------------
