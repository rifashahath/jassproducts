-- ==============================================================================
-- JASS PRODUCTS: FIX ORDERS SCHEMA & INSTALL PROCESS_ORDER_ATOMIC
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/duxjhmhgiacmuuqzfjxs/sql
-- ==============================================================================

BEGIN;

-- 1. Ensure all expected columns exist on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Ensure all expected columns exist on public.order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Drop existing overloads of process_order_atomic
DROP FUNCTION IF EXISTS public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB, TEXT
);

DROP FUNCTION IF EXISTS public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
);

-- 4. Create authoritative process_order_atomic
CREATE FUNCTION public.process_order_atomic(
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
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_razorpay_order_id TEXT DEFAULT NULL,
  p_razorpay_signature TEXT DEFAULT NULL
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
  v_existing RECORD;

  v_coupon JSONB;
  v_coupon_id TEXT;
  v_coupon_code TEXT;
  v_coupon_status TEXT;
  v_coupon_expiry TIMESTAMPTZ;
  v_coupon_min NUMERIC;
  v_coupon_type TEXT;
  v_coupon_value NUMERIC;
  v_coupon_cap NUMERIC;
  v_coupon_limit INTEGER;
  v_coupon_used INTEGER;

  c_standard_shipping CONSTANT NUMERIC := 499;
  c_free_ship_threshold CONSTANT NUMERIC := 5000;
  c_gst_rate CONSTANT NUMERIC := 0.18;

  v_raw_subtotal NUMERIC := 0;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_taxable NUMERIC := 0;
  v_shipping NUMERIC := 0;
  v_gst NUMERIC := 0;
  v_total NUMERIC := 0;
  v_coupon_applied BOOLEAN := false;

  v_notes JSONB := '[]'::JSONB;
  v_supplied JSONB;
  v_derived JSONB;
  v_mismatch BOOLEAN := false;
BEGIN
  -- 1. Idempotency checks
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'message', 'Order already processed (idempotent response)'
    );
  END IF;

  IF p_payment_id IS NOT NULL AND trim(p_payment_id) <> '' THEN
    SELECT id, total, status INTO v_existing
    FROM public.orders
    WHERE payment_id = trim(p_payment_id)
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing.id,
        'total', v_existing.total,
        'status', v_existing.status,
        'message', 'Payment already processed (idempotent response)'
      );
    END IF;
  END IF;

  -- 2. Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Authorization check
  IF COALESCE(auth.role(), '') != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to create an order';
    END IF;

    IF NOT public.is_admin() THEN
      IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access Denied: Cannot create order for another user ID';
      END IF;
    END IF;
  END IF;

  -- 4. Lock and deduct stock in deterministic order
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

    v_raw_subtotal := v_raw_subtotal + (GREATEST(v_product.price, 0) * v_qty);

    INSERT INTO public.inventory_logs (
      id, product_id, quantity_change, previous_stock, new_stock, type, reason
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

  v_subtotal := round(v_raw_subtotal);

  -- 5. Coupon calculation
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT to_jsonb(c) INTO v_coupon
    FROM public.coupons c
    WHERE UPPER(c.code) = UPPER(trim(p_coupon_code))
    FOR UPDATE;

    IF NOT FOUND THEN
      v_notes := v_notes || to_jsonb('coupon_not_found:' || trim(p_coupon_code));
    ELSE
      v_coupon_id     := v_coupon ->> 'id';
      v_coupon_code   := COALESCE(v_coupon ->> 'code', trim(p_coupon_code));
      v_coupon_status := v_coupon ->> 'status';
      v_coupon_expiry := (v_coupon ->> 'expiry_date')::TIMESTAMPTZ;
      v_coupon_min    := (v_coupon ->> 'min_order_amount')::NUMERIC;
      v_coupon_type   := v_coupon ->> 'discount_type';
      v_coupon_value  := (v_coupon ->> 'discount_value')::NUMERIC;
      v_coupon_cap    := (v_coupon ->> 'max_discount_cap')::NUMERIC;
      v_coupon_limit  := (v_coupon ->> 'total_usage_limit')::INTEGER;
      v_coupon_used   := (v_coupon ->> 'used_count')::INTEGER;

      IF COALESCE(v_coupon_status, '') <> ''
         AND UPPER(v_coupon_status) <> 'ACTIVE' THEN
        v_notes := v_notes || to_jsonb('coupon_inactive:' || v_coupon_code);
      ELSIF v_coupon_expiry IS NOT NULL AND v_coupon_expiry < now() THEN
        v_notes := v_notes || to_jsonb('coupon_expired:' || v_coupon_code);
      ELSIF v_coupon_min IS NOT NULL
            AND v_coupon_min <> 0
            AND v_subtotal < v_coupon_min THEN
        v_notes := v_notes || to_jsonb('coupon_min_order_not_met:' || v_coupon_code);
      ELSIF v_subtotal > 0 THEN
        IF UPPER(COALESCE(v_coupon_type, 'PERCENTAGE')) IN ('PERCENTAGE', 'PERCENT') THEN
          v_discount := round((v_subtotal * COALESCE(v_coupon_value, 0)) / 100);
          IF v_coupon_cap IS NOT NULL
             AND v_coupon_cap <> 0
             AND v_discount > v_coupon_cap THEN
            v_discount := v_coupon_cap;
          END IF;
        ELSE
          v_discount := round(COALESCE(v_coupon_value, 0));
        END IF;

        v_discount := LEAST(v_subtotal, GREATEST(v_discount, 0));

        IF v_discount > 0 THEN
          v_coupon_applied := true;

          UPDATE public.coupons
          SET used_count = COALESCE(used_count, 0) + 1
          WHERE id = v_coupon_id;

          IF v_coupon_limit IS NOT NULL
             AND COALESCE(v_coupon_used, 0) >= v_coupon_limit THEN
            v_notes := v_notes || to_jsonb('coupon_usage_limit_exceeded:' || v_coupon_code);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 6. Math derivation
  v_taxable  := GREATEST(v_subtotal - v_discount, 0);
  v_shipping := CASE
                  WHEN v_subtotal >= c_free_ship_threshold OR v_subtotal = 0 THEN 0
                  ELSE c_standard_shipping
                END;
  v_gst      := round(v_taxable * c_gst_rate);
  v_total    := GREATEST(v_taxable + v_shipping + v_gst, 0);

  -- 7. Verification vs supplied
  IF COALESCE(p_subtotal, -1)      != v_subtotal
     OR COALESCE(p_discount, -1)      != v_discount
     OR COALESCE(p_shipping_cost, -1) != v_shipping
     OR COALESCE(p_gst, -1)           != v_gst
     OR COALESCE(p_total, -1)         != v_total THEN
    v_mismatch := true;
    v_supplied := jsonb_build_object(
      'subtotal', p_subtotal, 'discount', p_discount, 'shipping_cost', p_shipping_cost,
      'gst', p_gst, 'total', p_total
    );
    v_derived := jsonb_build_object(
      'subtotal', v_subtotal, 'discount', v_discount, 'shipping_cost', v_shipping,
      'gst', v_gst, 'total', v_total
    );
    RAISE WARNING 'ORDER_PRICING_MISMATCH order=% supplied=% derived=%',
      p_order_id, v_supplied, v_derived;
  END IF;

  v_customer_name := COALESCE(
    p_shipping_address->>'fullName',
    p_shipping_address->>'name',
    p_user_email,
    'Customer'
  );

  -- 8. Insert into public.orders
  INSERT INTO public.orders (
    id, user_id, customer_name, customer_email, user_email, phone, user_phone,
    subtotal, shipping_cost, discount, gst, total, total_amount,
    status, payment_method, payment_id, order_id, razorpay_signature,
    shipping_address, items, items_summary,
    created_at, updated_at
  ) VALUES (
    p_order_id, p_user_id, v_customer_name,
    COALESCE(p_user_email, 'customer@jassproducts.com'),
    p_user_email,
    COALESCE(p_user_phone, p_shipping_address->>'phone'),
    p_user_phone,
    v_subtotal, v_shipping, v_discount, v_gst, v_total, v_total,
    'PROCESSING',
    COALESCE(p_payment_method, 'PREPAID_ONLINE'),
    NULLIF(trim(COALESCE(p_payment_id, '')), ''),
    NULLIF(trim(COALESCE(p_razorpay_order_id, '')), ''),
    NULLIF(trim(COALESCE(p_razorpay_signature, '')), ''),
    COALESCE(p_shipping_address, '{}'::jsonb),
    p_items,
    (SELECT string_agg(i->>'name' || ' (x' || (i->>'qty') || ')', ', ') FROM jsonb_array_elements(p_items) AS i),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- 9. Insert line items into public.order_items
  FOR v_item IN
    SELECT t.id, t.qty, t.name, t.image, pr.price AS catalog_price
    FROM jsonb_to_recordset(p_items) AS t(id TEXT, qty INTEGER, name TEXT, price NUMERIC, image TEXT)
    JOIN public.products pr ON pr.id = t.id
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, price, discount, subtotal, image_url, image
    ) VALUES (
      p_order_id,
      v_item.id,
      COALESCE(v_item.name, 'Product'),
      v_item.qty,
      GREATEST(COALESCE(v_item.catalog_price, 0), 0),
      GREATEST(COALESCE(v_item.catalog_price, 0), 0),
      0,
      GREATEST(COALESCE(v_item.catalog_price, 0), 0) * v_item.qty,
      v_item.image,
      v_item.image
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'total', v_total,
    'status', 'PROCESSING',
    'pricing', jsonb_build_object(
      'subtotal', v_subtotal, 'discount', v_discount, 'shipping_cost', v_shipping,
      'gst', v_gst, 'total', v_total, 'coupon_applied', v_coupon_applied
    ),
    'notes', v_notes
  ) || CASE
         WHEN v_mismatch THEN jsonb_build_object(
           'pricing_mismatch', jsonb_build_object('supplied', v_supplied, 'derived', v_derived)
         )
         ELSE '{}'::jsonb
       END;
END;
$$;

-- 5. Set security and permissions
REVOKE EXECUTE ON FUNCTION public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
) TO service_role;

COMMIT;
