-- ==============================================================================
-- PHASE 3: DATABASE DRIFT RESOLUTION & ATOMIC INVENTORY / ORDER CREATION
-- Authoritative Schema Alignment for Jass Products
-- ==============================================================================

-- 1. Ensure Missing Relational & Configuration Tables Exist
CREATE TABLE IF NOT EXISTS public.store_cms_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  image_url TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2. Master is_admin() Function & Profile Role Protection
CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.role() != 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Modifying user role is restricted to administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_update();

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

  -- Check verified server-side app_metadata
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPER_ADMIN') THEN
    RETURN true;
  END IF;

  -- Check dedicated admin_users table
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  -- Check profiles role column
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF UPPER(COALESCE(v_role, '')) IN ('ADMIN', 'SUPER_ADMIN') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO public, anon, authenticated, service_role;

-- 3. Atomic Order Creation + Stock Decrement RPC
CREATE OR REPLACE FUNCTION public.process_order_atomic(
  p_order_id TEXT,
  p_user_id UUID,
  p_user_email TEXT,
  p_user_phone TEXT,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_shipping_cost NUMERIC,
  p_discount NUMERIC,
  p_gst NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_shipping_address JSONB,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_product_id TEXT;
  v_qty INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_customer_name TEXT;
  v_computed_subtotal NUMERIC := 0;
  v_coupon RECORD;
BEGIN
  -- Idempotency Check: Prevent duplicate order processing
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'message', 'Order already processed (idempotent response)'
    );
  END IF;

  -- Validate Items Array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Authorization Check
  IF auth.role() != 'service_role' AND auth.uid() IS NOT NULL THEN
    IF p_user_id IS NOT NULL AND p_user_id != auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Cannot create order for another user ID';
    END IF;
  END IF;

  -- Atomically lock product rows and deduct stock in deterministic order
  FOR v_item IN 
    SELECT * FROM jsonb_to_recordset(p_items) AS (
      id TEXT,
      qty INTEGER,
      name TEXT,
      price NUMERIC,
      image TEXT
    ) ORDER BY id
  LOOP
    v_product_id := v_item.id;
    v_qty := v_item.qty;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Item % has invalid quantity: %', v_product_id, v_qty;
    END IF;

    -- Row-Level Lock with FOR UPDATE to prevent race conditions
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID "%" does not exist in catalog', v_product_id;
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (Requested: %, Available: %)', 
        COALESCE(v_product.name, v_product_id), v_qty, v_product.stock;
    END IF;

    v_current_stock := v_product.stock;
    v_new_stock := v_current_stock - v_qty;

    UPDATE public.products
    SET stock = v_new_stock,
        in_stock = (v_new_stock > 0),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_product_id;

    v_computed_subtotal := v_computed_subtotal + (v_product.price * v_qty);

    -- Insert Audit Movement Log
    INSERT INTO public.inventory_logs (
      id,
      product_id,
      quantity_change,
      previous_stock,
      new_stock,
      type,
      reason
    ) VALUES (
      gen_random_uuid()::text,
      v_product_id,
      -v_qty,
      v_current_stock,
      v_new_stock,
      'SALE',
      'Order Placed: ' || p_order_id
    );
  END LOOP;

  -- Validate Coupon if provided
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(trim(p_coupon_code))
    FOR UPDATE;

    IF FOUND THEN
      IF v_coupon.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Coupon "%" is inactive', p_coupon_code;
      END IF;
      IF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < now() THEN
        RAISE EXCEPTION 'Coupon "%" has expired', p_coupon_code;
      END IF;
      IF v_coupon.total_usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.total_usage_limit THEN
        RAISE EXCEPTION 'Coupon "%" usage limit reached', p_coupon_code;
      END IF;

      UPDATE public.coupons
      SET used_count = used_count + 1
      WHERE UPPER(code) = UPPER(trim(p_coupon_code));
    END IF;
  END IF;

  v_customer_name := COALESCE(
    p_shipping_address->>'fullName',
    p_shipping_address->>'name',
    p_user_email,
    'Customer'
  );

  -- Insert Main Order Record
  INSERT INTO public.orders (
    id,
    user_id,
    customer_name,
    customer_email,
    user_email,
    phone,
    user_phone,
    subtotal,
    shipping_cost,
    discount,
    gst,
    total,
    total_amount,
    status,
    payment_method,
    shipping_address,
    items,
    items_summary,
    created_at,
    updated_at
  ) VALUES (
    p_order_id,
    p_user_id,
    v_customer_name,
    COALESCE(p_user_email, 'customer@jassproducts.com'),
    p_user_email,
    COALESCE(p_user_phone, p_shipping_address->>'phone'),
    p_user_phone,
    p_subtotal,
    p_shipping_cost,
    p_discount,
    p_gst,
    p_total,
    p_total,
    'PROCESSING',
    COALESCE(p_payment_method, 'PREPAID_ONLINE'),
    COALESCE(p_shipping_address, '{}'::jsonb),
    p_items,
    (SELECT string_agg(i->>'name' || ' (x' || (i->>'qty') || ')', ', ') FROM jsonb_array_elements(p_items) AS i),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- Insert Relational Order Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
    id TEXT,
    qty INTEGER,
    name TEXT,
    price NUMERIC,
    image TEXT
  )
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      price,
      discount,
      subtotal,
      image_url,
      image
    ) VALUES (
      p_order_id,
      v_item.id,
      COALESCE(v_item.name, 'Product'),
      v_item.qty,
      COALESCE(v_item.price, 0),
      COALESCE(v_item.price, 0),
      0,
      COALESCE(v_item.price, 0) * v_item.qty,
      v_item.image,
      v_item.image
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'total', p_total,
    'status', 'PROCESSING'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_order_atomic FROM public, anon;
GRANT EXECUTE ON FUNCTION public.process_order_atomic TO authenticated, service_role;

-- 4. Atomic Single Product Stock Decrement Function
CREATE OR REPLACE FUNCTION public.decrease_product_stock(
  p_product_id TEXT,
  p_qty INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be greater than zero');
  END IF;

  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_current_stock < p_qty THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock available',
      'available_stock', v_current_stock
    );
  END IF;

  v_new_stock := v_current_stock - p_qty;

  UPDATE public.products
  SET stock = v_new_stock,
      in_stock = (v_new_stock > 0),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;

  INSERT INTO public.inventory_logs (
    id,
    product_id,
    quantity_change,
    previous_stock,
    new_stock,
    type,
    reason
  ) VALUES (
    gen_random_uuid()::text,
    p_product_id,
    -p_qty,
    v_current_stock,
    v_new_stock,
    'MANUAL_DEDUCT',
    'Direct stock reduction'
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrease_product_stock FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrease_product_stock TO service_role;

-- 5. Atomic Order Cancellation & Stock Restoration RPC (Hardened)
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
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order "%" not found', p_order_id;
  END IF;

  -- Authorization Check
  IF auth.role() != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to cancel order';
    END IF;
    IF (v_order.user_id IS NOT NULL AND v_order.user_id != auth.uid()) AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You do not have permission to cancel this order';
    END IF;
  END IF;

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

  -- Restore stock for items
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
          id,
          product_id,
          quantity_change,
          previous_stock,
          new_stock,
          type,
          reason
        ) VALUES (
          gen_random_uuid()::text,
          v_item.product_id,
          v_item.quantity,
          v_current_stock,
          v_new_stock,
          'RESTORE',
          'Order Cancelled Restock: ' || p_order_id || ' (' || COALESCE(p_reason, 'Restock') || ')'
        );
      END IF;
    END IF;
  END LOOP;

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

REVOKE EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) TO authenticated, service_role;

-- 6. Enable RLS and Master Policies for New Tables
ALTER TABLE public.store_cms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store CMS config" ON public.store_cms_config;
CREATE POLICY "Public can read store CMS config" ON public.store_cms_config
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage store CMS config" ON public.store_cms_config;
CREATE POLICY "Admins can manage store CMS config" ON public.store_cms_config
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
CREATE POLICY "Admins manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
