-- ==============================================================================
-- JASS PRODUCTS: MASTER PRODUCTION DATABASE SCHEMA & SEED SCRIPT
-- Target: Supabase PostgreSQL
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    note TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    sale_price NUMERIC,
    image TEXT NOT NULL,
    hover_image TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    badge TEXT,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    stock INT DEFAULT 50,
    in_stock BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage products" ON public.products;
CREATE POLICY "Service role manage products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. COUPONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC DEFAULT 0,
    max_discount_cap NUMERIC,
    total_usage_limit INTEGER DEFAULT 1000,
    used_count INTEGER DEFAULT 0,
    expiry_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

-- Insert Welcome coupon
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, status)
VALUES ('c_welcome10', 'WELCOME10', 'Welcome 10% Off First Purchase', 'PERCENTAGE', 10, 20, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. PROFILES & ADMIN USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

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

  IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF UPPER(COALESCE(v_role, '')) IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. ORDERS & ORDER ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    phone TEXT,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    shipping_fee NUMERIC NOT NULL DEFAULT 0,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    amount_in_paise BIGINT,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'razorpay',
    payment_id TEXT,
    razorpay_order_id TEXT,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
CREATE POLICY "Service role full access on orders" ON public.orders
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on order_items" ON public.order_items;
CREATE POLICY "Service role full access on order_items" ON public.order_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. INVENTORY LOGS & ATOMIC CANCELLATION RPC
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);

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

  IF auth.role() != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to cancel order';
    END IF;
    IF (v_order.user_id IS NULL OR v_order.user_id != auth.uid()) AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You do not have permission to cancel this order';
    END IF;
  END IF;

  IF UPPER(COALESCE(v_order.status, '')) = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is already cancelled', 'order_id', p_order_id);
  END IF;

  IF UPPER(COALESCE(v_order.status, '')) IN ('DELIVERED', 'SHIPPED') THEN
    RAISE EXCEPTION 'Cannot cancel an order with status "%"', v_order.status;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.cancel_order_restore_stock(TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. PRODUCT REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read reviews" ON public.product_reviews;
CREATE POLICY "Public read reviews" ON public.product_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
CREATE POLICY "Public insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. SEED JASS PRODUCTS CATALOG
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
    id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured
) VALUES
  (
    'jp-1',
    'Silky Shine & Anti Dandruff Combo',
    'silky-shine-anti-dandruff-combo',
    'HAIR CARE',
    'Holistic hair care combo formulated with natural botanical extracts to eliminate dandruff while imparting a silky shine.',
    'Scalp and follicle balancing treatment',
    42.00,
    '/newcat-1.png',
    '/newcat-1.png',
    '["/newcat-1.png"]'::jsonb,
    'Best Seller',
    4.9,
    38,
    100,
    true,
    true
  ),
  (
    'jp-2',
    'Renew Serum',
    'renew-serum',
    'SKIN RENEWAL',
    'Concentrated botanical renewal serum targeting fine lines, hydration barrier restoration, and cellular turnover.',
    'Fast-absorbing revitalizing facial nectar',
    58.00,
    '/newcat-2.png',
    '/newcat-2.png',
    '["/newcat-2.png"]'::jsonb,
    'Top Rated',
    5.0,
    52,
    75,
    true,
    true
  ),
  (
    'jp-3',
    'Pure Essential Oil',
    'pure-essential-oil',
    'AROMATHERAPY',
    '100% pure steam-distilled organic essential oil providing therapeutic calming aromas and rich skin hydration.',
    'Multipurpose aromatherapy essential drops',
    28.00,
    '/newcat-3.png',
    '/newcat-3.png',
    '["/newcat-3.png"]'::jsonb,
    'Organic',
    4.8,
    29,
    80,
    true,
    true
  ),
  (
    'jp-4',
    'Balance Toner',
    'balance-toner',
    'TONE & PREP',
    'Gentle balancing toner with witch hazel and rose floral water to refine pores and optimize skin pH levels.',
    'Alcohol-free skin prep infusion',
    34.00,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600&h=600',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600&h=600',
    '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600&h=600"]'::jsonb,
    'Trending',
    4.7,
    19,
    60,
    true,
    true
  ),
  (
    'jp-5',
    'Deep Hydrating Cream Sets',
    'deep-hydrating-cream-sets',
    'FACE NOURISH',
    'Rich ceramide and plant lipid moisture reservoir providing 24-hour hydration lock for tired or dehydrated skin.',
    'Intensive hydration therapy set',
    85.00,
    '/newcat-4.png',
    '/newcat-4.png',
    '["/newcat-4.png"]'::jsonb,
    'Limited Edition',
    4.9,
    44,
    40,
    true,
    true
  ),
  (
    'jp-6',
    'Nourishing Body Wash',
    'nourishing-body-wash',
    'BODY CARE',
    'Luxurious non-stripping body wash formulated with plant ceramides and refreshing herbal scents.',
    'Silky botanical body lather',
    32.00,
    '/newcat-1.png',
    '/newcat-1.png',
    '["/newcat-1.png"]'::jsonb,
    NULL,
    4.6,
    22,
    50,
    true,
    false
  ),
  (
    'jp-7',
    'Glow Face Mask',
    'glow-face-mask',
    'SKIN RENEWAL',
    'Clarifying antioxidant treatment mask packed with bio-available vitamin C and natural French clay.',
    'Weekly glow and clarify ritual',
    45.00,
    '/newcat-2.png',
    '/newcat-2.png',
    '["/newcat-2.png"]'::jsonb,
    'Popular',
    4.8,
    31,
    35,
    true,
    false
  ),
  (
    'jp-8',
    'Calming Sleep Mist',
    'calming-sleep-mist',
    'AROMATHERAPY',
    'Tranquil sleep mist infused with Bulgarian lavender, chamomile, and bergamot essential oils.',
    'Aromatherapeutic nightly pillow mist',
    24.00,
    '/newcat-3.png',
    '/newcat-3.png',
    '["/newcat-3.png"]'::jsonb,
    NULL,
    4.9,
    60,
    90,
    true,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  note = EXCLUDED.note,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  hover_image = EXCLUDED.hover_image,
  gallery = EXCLUDED.gallery,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  stock = EXCLUDED.stock,
  in_stock = EXCLUDED.in_stock,
  is_featured = EXCLUDED.is_featured;

-- Seed sample customer reviews
INSERT INTO public.product_reviews (product_id, author, rating, title, comment, verified, helpful_count) VALUES
('jp-1', 'Aarav Mehta', 5, 'Transformative hair combo!', 'Cleared flakes within the first week of use. Hair feels noticeably smoother and lighter.', true, 18),
('jp-2', 'Meera Krishnan', 5, 'My daily glow essential', 'Lightweight texture that sinks right in without feeling greasy. Visible hydration boost.', true, 24),
('jp-5', 'Sunita Rao', 5, 'Deep hydration all day', 'My skin gets very dry in AC rooms, but this cream keeps it plump and nourished throughout the day.', true, 15);
