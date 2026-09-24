-- ==============================================================================
-- ASTER DECORZ (FLORA ARTISANS CO.) - PRODUCTION MASTER DATABASE MIGRATION
-- Fixes: CRIT-01, CRIT-03, CRIT-04, CRIT-05, HIGH-01, HIGH-04
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. HELPER FUNCTIONS: ADMIN ROLE VERIFICATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_role text;
  v_is_admin_user boolean;
BEGIN
  -- 1. Check verified app_metadata in JWT (only modifiable by Supabase service_role)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPER_ADMIN') THEN
    RETURN true;
  END IF;

  -- 2. Check dedicated admin_users table
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('ADMIN', 'SUPER_ADMIN')
    ) INTO v_is_admin_user;

    IF v_is_admin_user THEN
      RETURN true;
    END IF;

    -- 3. Check profiles table verified role
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    IF UPPER(COALESCE(v_role, '')) IN ('ADMIN', 'SUPER_ADMIN') THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- ==============================================================================
-- 2.1 PROFILES TABLE & AUTH USER TRIGGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'USER',
  is_blocked BOOLEAN DEFAULT false,
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
    'CUSTOMER' -- Safe default role
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
-- 3. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (

  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  category TEXT NOT NULL,
  description TEXT,
  note TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  cost_price NUMERIC DEFAULT 0,
  image TEXT NOT NULL,
  hover_image TEXT,
  gallery TEXT[] DEFAULT '{}'::TEXT[],
  badge TEXT,
  rating NUMERIC DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
  min_stock_threshold INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure updated columns exist if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 4. PRODUCT REVIEWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if product_reviews table already existed
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';


-- ==============================================================================
-- 5. ORDERS TABLE (ALIGNED WITH FRONTEND STORE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  user_email TEXT,
  phone TEXT,
  user_phone TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  gst NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_method TEXT DEFAULT 'RAZORPAY',
  payment_id TEXT,
  order_id TEXT,
  razorpay_signature TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  items_summary TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all aligned columns exist if public.orders already exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (UPPER(status) IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'));


-- ==============================================================================
-- 6. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT,
  description TEXT,
  image TEXT,
  banner_image TEXT,
  display_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'INACTIVE')),
  products_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if categories table already existed
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS products_count INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_status_check CHECK (UPPER(status) IN ('ACTIVE', 'DRAFT', 'INACTIVE', 'ARCHIVED'));

-- ==============================================================================
-- 7. COUPONS & PROMOTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  total_usage_limit INTEGER DEFAULT 1000,
  used_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if coupons table already existed
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS total_usage_limit INTEGER DEFAULT 1000;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check CHECK (UPPER(discount_type) IN ('PERCENTAGE', 'FIXED', 'FLAT', 'PERCENT', 'AMOUNT', 'FREE_SHIPPING'));
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_status_check CHECK (UPPER(status) IN ('ACTIVE', 'DISABLED', 'EXPIRED', 'SCHEDULED', 'INACTIVE', 'DRAFT'));

-- ==============================================================================
-- 8. BANNERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  image TEXT NOT NULL,
  link TEXT DEFAULT '/shop',
  cta_text TEXT DEFAULT 'Shop Now',
  display_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if banners table already existed
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '/shop';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Shop Now';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_status_check;
ALTER TABLE public.banners ADD CONSTRAINT banners_status_check CHECK (UPPER(status) IN ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'));

-- ==============================================================================
-- 9. USER ADDRESSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if user_addresses table already existed
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 10. INVENTORY MOVEMENT AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id TEXT PRIMARY KEY,
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

-- Ensure all columns exist if inventory_logs table already existed
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS quantity_change INTEGER;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS previous_stock INTEGER;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS new_stock INTEGER;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 11. STORE SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());


-- ==============================================================================
-- 12. ATOMIC INVENTORY DECREMENT RPC (FIXES HIGH-01 RACE CONDITION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.decrease_product_stock(
  p_product_id TEXT,
  p_qty INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be greater than 0');
  END IF;

  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_current_stock < p_qty THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock available');
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
    'ORDER_DEDUCT',
    'Automated order stock deduction'
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock);
END;
$$;

-- Restrict stock deduction function to service_role (Fix for CRIT-03 Inventory Exhaustion)
REVOKE EXECUTE ON FUNCTION public.decrease_product_stock(TEXT, INTEGER) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrease_product_stock(TEXT, INTEGER) TO service_role;

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- --- PROFILES POLICIES ---
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- --- PRODUCTS POLICIES ---

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;

DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;

CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admin insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin update products" ON public.products
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete products" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- PRODUCT REVIEWS POLICIES ---
DROP POLICY IF EXISTS "Public read reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Allow public insert reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admin update reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admin delete reviews" ON public.product_reviews;

CREATE POLICY "Public read reviews" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Public insert reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update reviews" ON public.product_reviews
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin delete reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- ORDERS POLICIES (FIXES CRIT-01 DATA LEAK) ---
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Public checkout insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated checkout insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;

CREATE POLICY "Users read own orders or admin" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_admin()
  );

CREATE POLICY "Authenticated checkout insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Admin update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- CATEGORIES POLICIES ---
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admin insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin update categories" ON public.categories;
DROP POLICY IF EXISTS "Admin delete categories" ON public.categories;

CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());

CREATE POLICY "Admin insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- COUPONS POLICIES ---
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;

CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());

CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- BANNERS POLICIES ---
DROP POLICY IF EXISTS "Public read active banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public read active banners" ON public.banners;
DROP POLICY IF EXISTS "Admin manage banners" ON public.banners;

CREATE POLICY "Public read active banners" ON public.banners
  FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());

CREATE POLICY "Admin manage banners" ON public.banners
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- USER ADDRESSES POLICIES ---
DROP POLICY IF EXISTS "Users manage own addresses" ON public.user_addresses;

CREATE POLICY "Users manage own addresses" ON public.user_addresses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- INVENTORY LOGS POLICIES ---
DROP POLICY IF EXISTS "Admin manage inventory logs" ON public.inventory_logs;

CREATE POLICY "Admin manage inventory logs" ON public.inventory_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- STORE SETTINGS POLICIES ---
DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin manage store settings" ON public.store_settings;

CREATE POLICY "Public read store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin manage store settings" ON public.store_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ==============================================================================
-- 14. SEED INITIAL DATA (CATEGORIES, COUPONS, DEFAULT SETTINGS)
-- ==============================================================================
INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES
  ('cat-1', 'Botanical Plants', 'botanical-plants', 'Handcrafted faux greenery & lush floor plants', '/plantpicture/p1/5.webp', 1, 'ACTIVE'),
  ('cat-2', 'Faux Trees', 'faux-trees', 'Architectural trees with real reclaimed timber trunks', '/plantpicture/p2/5.webp', 2, 'ACTIVE'),
  ('cat-3', 'Preserved Moss', 'preserved-moss', 'Zero-maintenance acoustic moss wall art panels', '/plantpicture/p3/5.webp', 3, 'ACTIVE'),
  ('cat-4', 'Planters & Vessels', 'planters-vessels', 'Hand-glazed ceramic and terracotta planters', '/plantpicture/p4/5.webp', 4, 'ACTIVE'),
  ('cat-5', 'Hanging Greenery', 'hanging-greenery', 'Cascading vines and trailing foliage for shelves', '/plantpicture/p5/5.webp', 5, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, total_usage_limit, used_count, expiry_date, status)
VALUES
  ('cp-1', 'VERDANT10', 'Welcome 10% discount on entire curated collection', 'PERCENTAGE', 10, 1000, 5000, 124, NOW() + INTERVAL '1 year', 'ACTIVE'),
  ('cp-2', 'LUXE500', 'Flat ₹500 discount on luxury statement orders above ₹5,000', 'FIXED', 500, 5000, 1000, 48, NOW() + INTERVAL '6 months', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_settings (key, value)
VALUES
  ('general', '{"storeName": "Jass Products", "currency": "INR", "currencySymbol": "₹", "supportEmail": "hello@jassproducts.com"}'::JSONB),
  ('shipping', '{"freeShippingThreshold": 5000, "standardShippingFee": 499, "estimatedDays": "3-5"}'::JSONB)
ON CONFLICT (key) DO NOTHING;
