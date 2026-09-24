-- ==============================================================================
-- FIX FOR ADMIN AUTHORIZATION BYPASS & P0 IDOR IN ORDER CANCELLATION
-- ==============================================================================

-- 1. SECURE IS_ADMIN FUNCTION: Add STORE_MANAGER role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Check verified server-side app_metadata in JWT (service_role managed)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  -- 2. Check dedicated admin_users registry table
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  -- 3. Check profiles table (protected by trigger below)
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF UPPER(COALESCE(v_role, '')) IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- 2. HARDENED ORDER CANCELLATION RPC (P0 CRITICAL BOLA/IDOR FIX)
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
  IF auth.role() != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to cancel order';
    END IF;
    IF (v_order.user_id IS NULL OR v_order.user_id != auth.uid()) AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You do not have permission to cancel this order';
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
REVOKE EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) TO authenticated, service_role;
