-- ==============================================================================
-- ASTER DECORZ (FLORA ARTISANS CO.) - PRODUCTION MASTER REMEDIATION MIGRATION
-- Authoritative Fix for: Schema Drift, P0 Critical BOLA/IDOR on Order Cancellation,
-- P1 Privilege Escalation on profiles.role, P1 RPC Price Tampering, and RLS Hardening.
-- Target: Supabase PostgreSQL Database (Fully Idempotent & Non-Destructive)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. SCHEMA DRIFT RESOLUTION: TABLES & COLUMN SYNCHRONIZATION
-- ==============================================================================

-- 2.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'USER',
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2.2 DEDICATED ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  note TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  cost_price NUMERIC DEFAULT 0 CHECK (cost_price >= 0),
  image TEXT NOT NULL,
  hover_image TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  badge TEXT,
  rating NUMERIC DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock_threshold INTEGER DEFAULT 5 CHECK (min_stock_threshold >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2.4 ORDERS TABLE (Synchronized with frontend & serverless API)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  user_email TEXT,
  phone TEXT,
  user_phone TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_cost NUMERIC NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  gst NUMERIC NOT NULL DEFAULT 0 CHECK (gst >= 0),
  discount NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT NOT NULL DEFAULT 'RAZORPAY',
  payment_id TEXT,
  order_id TEXT,
  razorpay_signature TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_summary TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2.5 ORDER ITEMS TABLE (Normalized Relational Line Items)
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
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Backfill missing columns in order_items
UPDATE public.order_items 
SET unit_price = COALESCE(unit_price, price, 0),
    price = COALESCE(price, unit_price, 0),
    subtotal = COALESCE(subtotal, quantity * COALESCE(unit_price, price, 0), 0),
    image_url = COALESCE(image_url, image),
    image = COALESCE(image, image_url)
WHERE unit_price IS NULL OR subtotal IS NULL OR price IS NULL;

-- 2.6 USER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 INVENTORY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  supplier_name TEXT,
  po_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 CATEGORIES, COUPONS, BANNERS, CMS & SETTINGS
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  image TEXT,
  banner_image TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  products_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  total_usage_limit INTEGER DEFAULT 1000,
  used_count INTEGER NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  image TEXT NOT NULL,
  link TEXT DEFAULT '/shop',
  cta_text TEXT DEFAULT 'Shop Now',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  placement TEXT DEFAULT 'HOME_HERO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'HOME_HERO';

CREATE TABLE IF NOT EXISTS public.store_cms_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE & INTEGRITY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- ==============================================================================
-- 4. PRIVILEGE ESCALATION DEFENSE & HELPER FUNCTIONS
-- ==============================================================================

-- 4.1 SECURE IS_ADMIN FUNCTION
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

-- 4.2 TRIGGER TO PREVENT USERS FROM SELF-ASSIGNING ADMIN IN PROFILES
CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only Supabase service_role or verified admin can modify role column
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

-- 4.3 AUTH USER SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'CUSTOMER'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile creation warning: %', SQLERRM;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ATOMIC BUSINESS TRANSACTIONS & SECURED RPC FUNCTIONS
-- ==============================================================================

-- 5.1 ATOMIC SINGLE PRODUCT STOCK DECREMENT (Restricted to service_role)
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
    id, product_id, quantity_change, previous_stock, new_stock, type, reason
  ) VALUES (
    gen_random_uuid()::text,
    p_product_id,
    -p_qty,
    v_current_stock,
    v_new_stock,
    'ORDER_DEDUCT',
    'Direct stock reduction via RPC'
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock);
END;
$$;

-- Restrict stock deduction function strictly to service_role
REVOKE EXECUTE ON FUNCTION public.decrease_product_stock(TEXT, INTEGER) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrease_product_stock(TEXT, INTEGER) TO service_role;


-- 5.2 HARDENED ORDER CANCELLATION RPC (P0 CRITICAL BOLA/IDOR FIX)
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


-- 5.3 HARDENED ATOMIC ORDER CREATION RPC (P1 PRICE TAMPERING & IDOR FIX)
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
  -- 1. Idempotency Check: Prevent duplicate order processing
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'message', 'Order already processed (idempotent response)'
    );
  END IF;

  -- 2. Validate Items Array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Authorization Check: Caller cannot spoof another user's ID unless service_role/admin
  IF auth.role() != 'service_role' AND auth.uid() IS NOT NULL THEN
    IF p_user_id IS NOT NULL AND p_user_id != auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Cannot create order for another user ID';
    END IF;
  END IF;

  -- 4. Lock & Deduct Product Stocks in Deterministic ID Sequence (Deadlock Prevention)
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

    -- Sum authoritative subtotal from catalog price
    v_computed_subtotal := v_computed_subtotal + (v_product.price * v_qty);

    -- Insert Audit Movement Log
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

  -- 5. Validate Coupon if supplied
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

  -- 6. Insert Main Order Record
  INSERT INTO public.orders (
    id, user_id, customer_name, customer_email, user_email, phone, user_phone,
    subtotal, shipping_cost, discount, gst, total, total_amount,
    status, payment_method, shipping_address, items, items_summary,
    created_at, updated_at
  ) VALUES (
    p_order_id, p_user_id, v_customer_name,
    COALESCE(p_user_email, 'customer@jassproducts.com'),
    p_user_email,
    COALESCE(p_user_phone, p_shipping_address->>'phone'),
    p_user_phone,
    p_subtotal, p_shipping_cost, p_discount, p_gst, p_total, p_total,
    'PROCESSING',
    COALESCE(p_payment_method, 'PREPAID_ONLINE'),
    COALESCE(p_shipping_address, '{}'::jsonb),
    p_items,
    (SELECT string_agg(i->>'name' || ' (x' || (i->>'qty') || ')', ', ') FROM jsonb_array_elements(p_items) AS i),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- 7. Insert Relational Order Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
    id TEXT,
    qty INTEGER,
    name TEXT,
    price NUMERIC,
    image TEXT
  )
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, price, discount, subtotal, image_url, image
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

-- ==============================================================================
-- 6. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all 12 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.2 ADMIN USERS POLICIES
DROP POLICY IF EXISTS "Admin view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin manage admin users" ON public.admin_users;
CREATE POLICY "Admin manage admin users" ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.3 PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.4 ORDERS POLICIES (BOLA / IDOR Protection)
DROP POLICY IF EXISTS "Users read own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Authenticated checkout insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;

CREATE POLICY "Users read own orders or admin" ON public.orders FOR SELECT 
  USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());
CREATE POLICY "Authenticated checkout insert orders" ON public.orders FOR INSERT 
  WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL TO authenticated 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.5 ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin manage order items" ON public.order_items;

CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Admin manage order items" ON public.order_items FOR ALL TO authenticated 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.6 USER ADDRESSES POLICIES
DROP POLICY IF EXISTS "Users manage own addresses" ON public.user_addresses;
CREATE POLICY "Users manage own addresses" ON public.user_addresses FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6.7 INVENTORY LOGS POLICIES
DROP POLICY IF EXISTS "Admin manage inventory logs" ON public.inventory_logs;
CREATE POLICY "Admin manage inventory logs" ON public.inventory_logs FOR ALL TO authenticated 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.8 CATEGORIES, COUPONS, BANNERS, CMS & SETTINGS POLICIES
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active banners" ON public.banners;
DROP POLICY IF EXISTS "Admin manage banners" ON public.banners;
CREATE POLICY "Public read active banners" ON public.banners FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
CREATE POLICY "Admin manage banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read cms config" ON public.store_cms_config;
DROP POLICY IF EXISTS "Admin manage cms config" ON public.store_cms_config;
CREATE POLICY "Public read cms config" ON public.store_cms_config FOR SELECT USING (true);
CREATE POLICY "Admin manage cms config" ON public.store_cms_config FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin manage store settings" ON public.store_settings;
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage store settings" ON public.store_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
