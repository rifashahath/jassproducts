-- ====================================================================
-- MASTER PRODUCTION MIGRATION & SEED SQL SCRIPT
-- For: Jass Products Botanicals E-Commerce
-- Target: Supabase PostgreSQL Database
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    note TEXT,
    price NUMERIC NOT NULL DEFAULT 99,
    image TEXT NOT NULL,
    hover_image TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    badge TEXT,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    stock INT DEFAULT 50,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

-- Upsert All 19 Plant Products (₹99 rate)
INSERT INTO public.products (
    id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, is_featured
) VALUES
  ('p1', 'Purple Blossom Bonsai Tree', 'p1', 'Bonsai Trees', 'Handcrafted artificial purple flowering bonsai tree with sculpted dark trunk and delicate fluted white planter.', 'Hand-finished purple bonsai foliage', 99, '/plantpicture/p1/5.webp', '/plantpicture/p1/varinat/4.png', '["/plantpicture/p1/5.webp","/plantpicture/p1/varinat/4.png","/plantpicture/p1/6.webp","/plantpicture/p1/7.webp","/plantpicture/p1/8.webp"]'::jsonb, 'Best Seller', 4.9, 42, 50, true),
  ('p2', 'Two-Tone Pink & Green Cedar Bonsai', 'p2', 'Bonsai Trees', 'Artistic dual-tiered bonsai with vibrant pink top canopy and lush green lower cedar foliage set in a modern square pot.', 'Dual-canopy pink & green cedar leaves', 99, '/plantpicture/p2/2.webp', '/plantpicture/p2/variant/3.png', '["/plantpicture/p2/2.webp","/plantpicture/p2/variant/3.png","/plantpicture/p2/3.webp","/plantpicture/p2/4.webp"]'::jsonb, 'Popular', 4.8, 35, 50, true),
  ('p3', 'Purple Bougainvillea Shrub', 'p3', 'Flowering Plants', 'Full, leafy bougainvillea bush with delicate magenta-purple petals nestling amidst dark green botanical leaves.', 'Lush indoor flowering accent', 99, '/plantpicture/p3/15.webp', '/plantpicture/p3/variant/6.png', '["/plantpicture/p3/15.webp","/plantpicture/p3/variant/6.png","/plantpicture/p3/16.webp","/plantpicture/p3/17.webp","/plantpicture/p3/18.webp","/plantpicture/p3/19.webp"]'::jsonb, 'Trending', 5.0, 29, 50, true),
  ('p4', 'Golden Blossom Flower Bush', 'p4', 'Flowering Plants', 'Radiant yellow marigold blossom bush bringing warmth and vibrant sunshine aesthetics to any desk or countertop.', 'Vibrant sunshine yellow blooms', 99, '/plantpicture/p4/9.webp', '/plantpicture/p4/variant/5.png', '["/plantpicture/p4/9.webp","/plantpicture/p4/variant/5.png","/plantpicture/p4/10.webp","/plantpicture/p4/11.webp","/plantpicture/p4/12.webp","/plantpicture/p4/13.webp","/plantpicture/p4/14.webp"]'::jsonb, NULL, 4.7, 18, 50, false),
  ('p5', 'Orange Calla Lily Grass Shrub', 'p5', 'Indoor Plants', 'Slender green ornamental grass stems topped with graceful orange calla lily buds in a textured white pot.', 'Elegant vertical calla lily stems', 99, '/plantpicture/p5/21.webp', '/plantpicture/p5/variant/7.png', '["/plantpicture/p5/21.webp","/plantpicture/p5/variant/7.png","/plantpicture/p5/20.webp","/plantpicture/p5/22.webp","/plantpicture/p5/23.webp","/plantpicture/p5/24.webp"]'::jsonb, 'New Arrival', 4.9, 31, 50, true),
  ('p6', 'Pink Trumpet Lily Bush', 'p6', 'Flowering Plants', 'Graceful pink trumpet lilies standing tall among rich olive-green foliage in a minimal matte white vessel.', 'Charming pink lily blossoms', 99, '/plantpicture/p6/25.webp', '/plantpicture/p6/variant/8.png', '["/plantpicture/p6/25.webp","/plantpicture/p6/variant/8.png","/plantpicture/p6/26.webp","/plantpicture/p6/27.webp","/plantpicture/p6/28.webp"]'::jsonb, NULL, 4.8, 22, 50, false),
  ('p7', 'Yellow Lotus Blossom Shrub', 'p7', 'Flowering Plants', 'Vibrant yellow lotus flower arrangement nestled in dense pointed green leaves and housed in a modern white pot.', 'Vibrant yellow lotus flowers', 99, '/plantpicture/p7/30.webp', '/plantpicture/p7/variant/9.png', '["/plantpicture/p7/30.webp","/plantpicture/p7/variant/9.png","/plantpicture/p7/29.webp","/plantpicture/p7/46.webp"]'::jsonb, NULL, 4.9, 27, 50, false),
  ('p8', 'Red Rose Topiary Shrub', 'p8', 'Decorative Topiary', 'Sculpted two-tier pine topiary dotted with delicate red miniature rosebuds, anchored in a white ribbed container.', 'Sculpted red rose topiary', 99, '/plantpicture/p8/33.webp', '/plantpicture/p8/variant/10.png', '["/plantpicture/p8/33.webp","/plantpicture/p8/variant/10.png","/plantpicture/p8/31.webp","/plantpicture/p8/32.webp","/plantpicture/p8/34.webp","/plantpicture/p8/35.webp","/plantpicture/p8/36.webp"]'::jsonb, 'Featured', 5.0, 54, 50, true),
  ('p9', 'Golden Sunflower Shrub', 'p9', 'Flowering Plants', 'Cheerful bright yellow sunflowers with feather fern green fronds set in a classic white square base.', 'Bright sunflower tabletop arrangement', 99, '/plantpicture/p9/37.webp', '/plantpicture/p9/38.webp', '["/plantpicture/p9/37.webp","/plantpicture/p9/38.webp","/plantpicture/p9/39.webp","/plantpicture/p9/40.webp","/plantpicture/p9/41.webp"]'::jsonb, NULL, 4.6, 19, 50, false),
  ('p10', 'Variegated Agave Greenery', 'p10', 'Indoor Plants', 'Lush yellow-tipped agave leaves delivering a clean architectural look for modern desks.', 'Clean yellow-tipped architectural greenery', 99, '/plantpicture/p10/44.webp', '/plantpicture/p10/varinat/11.png', '["/plantpicture/p10/44.webp","/plantpicture/p10/varinat/11.png","/plantpicture/p10/42.webp","/plantpicture/p10/43.webp"]'::jsonb, NULL, 4.8, 25, 50, false),
  ('p11', 'Red Cherry Berry Bonsai', 'p11', 'Bonsai Trees', 'Miniature artificial red fruit cherry tree with polished red cherries and detailed dark wooden trunk in a fluted white dish.', 'Vibrant red cherry bonsai accent', 99, '/plantpicture/p11/45.webp', '/plantpicture/p11/variant/12.png', '["/plantpicture/p11/45.webp","/plantpicture/p11/variant/12.png"]'::jsonb, 'Limited Edition', 4.9, 33, 50, true),
  ('p12', 'Vibrant Pink Leaf Bush', 'p12', 'Indoor Plants', 'Vibrant pink floral leaf foliage in a smooth white tabletop cylinder pot.', 'Vibrant pink leaf foliage', 99, '/plantpicture/p12/51.webp', '/plantpicture/p12/variant/14.png', '["/plantpicture/p12/51.webp","/plantpicture/p12/variant/14.png","/plantpicture/p12/47.webp","/plantpicture/p12/48.webp","/plantpicture/p12/49.webp","/plantpicture/p12/50.webp"]'::jsonb, NULL, 4.8, 28, 50, false),
  ('p13', 'Crescent Moon Purple Topiary', 'p13', 'Decorative Topiary', 'Artfully shaped crescent moon topiary featuring dense green needles accented with purple blossoms in a wide fluted bowl.', 'Unique crescent moon artistic topiary', 99, '/plantpicture/p13/57.webp', '/plantpicture/p13/variant/18.png', '["/plantpicture/p13/57.webp","/plantpicture/p13/variant/18.png","/plantpicture/p13/58.webp","/plantpicture/p13/59.webp","/plantpicture/p13/60.webp","/plantpicture/p13/61.webp","/plantpicture/p13/62.webp"]'::jsonb, 'Top Seller', 5.0, 47, 50, true),
  ('p14', 'Red Blossom Pine Shrub', 'p14', 'Indoor Plants', 'Feathery green pine bush studded with bright coral-red blossoms in a square white planter.', 'Feathery green pine with red accents', 99, '/plantpicture/p14/63.webp', '/plantpicture/p14/variant/19.png', '["/plantpicture/p14/63.webp","/plantpicture/p14/variant/19.png","/plantpicture/p14/64.webp","/plantpicture/p14/65.webp","/plantpicture/p14/66.webp","/plantpicture/p14/67.webp"]'::jsonb, NULL, 4.7, 16, 50, false),
  ('p15', 'Blue Bud Twin-Stem Greenery', 'p15', 'Indoor Plants', 'Double trunk artificial jasmine plant with lush green leaves and blue bud accents in a white square pot.', 'Double stem blue bud foliage', 99, '/plantpicture/p15/69.webp', '/plantpicture/p15/variant/20.png', '["/plantpicture/p15/69.webp","/plantpicture/p15/variant/20.png","/plantpicture/p15/68.webp","/plantpicture/p15/70.webp","/plantpicture/p15/71.webp"]'::jsonb, NULL, 4.9, 30, 50, false),
  ('p16', 'Pink Cypress Cedar Topiary', 'p16', 'Decorative Topiary', 'Vertical tiered cypress topiary with pink tips standing gracefully in a metallic bronze container.', 'Pink cypress topiary', 99, '/plantpicture/p16/56.webp', '/plantpicture/p16/variant/17.png', '["/plantpicture/p16/56.webp","/plantpicture/p16/variant/17.png","/plantpicture/p16/54.webp","/plantpicture/p16/55.webp"]'::jsonb, NULL, 4.8, 21, 50, false),
  ('p17', 'White Star Bud Mint Shrub', 'p17', 'Indoor Plants', 'Cute bushy mint foliage with tiny white star buds presented in a chic faceted geometric teal pot.', 'Faceted teal pot with star bud greenery', 99, '/plantpicture/p17/53.webp', '/plantpicture/p17/variant/16.png', '["/plantpicture/p17/53.webp","/plantpicture/p17/variant/16.png"]'::jsonb, NULL, 4.9, 23, 50, false),
  ('p18', 'Twin-Ball Grass Topiary', 'p18', 'Decorative Topiary', 'Architectural twin sphere grass topiary tree with rich dark trunk in a white ceramic vase.', 'Dual sphere grass topiary', 99, '/plantpicture/p18/52.webp', '/plantpicture/p18/variant/15.png', '["/plantpicture/p18/52.webp","/plantpicture/p18/variant/15.png"]'::jsonb, NULL, 4.8, 34, 50, false),
  ('p19', 'Japanese Cedar Pine Bonsai', 'p19', 'Bonsai Trees', 'Classic asymmetrical Japanese pine bonsai with detailed gnarled trunk in a traditional footed white ceramic bonsai pot.', 'Traditional Japanese cedar bonsai', 99, '/plantpicture/p19/1.webp', '/plantpicture/p19/variant/2.png', '["/plantpicture/p19/1.webp","/plantpicture/p19/variant/2.png"]'::jsonb, 'Premium Selection', 5.0, 62, 50, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
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
  is_featured = EXCLUDED.is_featured;

-- --------------------------------------------------------------------
-- 2. PRODUCT REVIEWS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
CREATE POLICY "Public read reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- Initial customer review seeds
INSERT INTO public.product_reviews (product_id, author, rating, title, comment, verified, helpful_count) VALUES
('p1', 'Ananya Sharma', 5, 'Absolutely lifelike quality!', 'I was hesitant about artificial botanicals, but this exceeded all expectations. The stem detailing looks stunning in our living room.', true, 14),
('p1', 'Vikramaditya R.', 5, 'Perfect statement piece', 'Zero maintenance and looks brand new every day. The pot quality is heavy premium stone ceramic.', true, 9),
('p2', 'Priya Nair', 5, 'Vibrant blossoms!', 'The purple petals catch the afternoon light beautifully. Everyone asks if it is real.', true, 11),
('p3', 'Karan Patel', 5, 'Worth every rupee', 'Fast delivery and extremely sturdy protective packaging. Highly recommended!', true, 8),
('p4', 'Sneha Kapoor', 4, 'Elegant office greenery', 'Fits on my desk seamlessly. Clean finish and zero watering needed.', true, 6);

-- --------------------------------------------------------------------
-- 3. ORDERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    phone TEXT,
    shipping_address JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cod',
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);

-- --------------------------------------------------------------------
-- 4. STORAGE BUCKET CONFIGURATION
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('images', 'images', true, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for Images Bucket" ON storage.objects;

CREATE POLICY "Public Read Access for Images Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Public Upload Access for Images Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');
