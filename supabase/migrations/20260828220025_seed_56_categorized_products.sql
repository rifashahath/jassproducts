-- ==============================================================================
-- ASTER DECORZ - 56 PRODUCTS & 5 TARGET CATEGORIES SEED MIGRATION
-- Categories:
-- 1. Artificial Bonsai
-- 2. Trees & Plants
-- 3. Flower Bushes
-- 4. Hanging
-- 5. Flower Plants and Pots
-- ==============================================================================

-- 1. Upsert 5 Target Categories
INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-1', 'Artificial Bonsai', 'artificial-bonsai', 'Traditional Japanese asymmetrical art bonsai & potted pines', '/plantpicture/p1/5.webp', 1, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-2', 'Trees & Plants', 'trees-plants', '5 FT tall statement trees, flowering canopies, palms & bamboo', '/plantpicture/1.jpg.webp', 2, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-3', 'Flower Bushes', 'flower-bushes', 'Blooming bougainvillea, trumpet lilies, sunflowers & rose shrubs', '/plantpicture/p3/15.webp', 3, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-4', 'Hanging', 'hanging', 'Cascading floral vines, trailing creepers & wall-hanging greenery', '/plantpicture/2.jpg.webp', 4, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-5', 'Flower Plants and Pots', 'flower-plants-and-pots', 'Potted tropical foliage, lotus blossoms & designer planters', '/plantpicture/4.jpg.webp', 5, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

-- 2. Upsert All 56 Products
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p1', 'Purple Blossom Bonsai Tree', 'p1', 'Artificial Bonsai', 'Handcrafted artificial purple flowering bonsai tree with sculpted dark trunk and delicate fluted white planter.', 'Hand-finished purple bonsai foliage', 99, '/plantpicture/p1/5.webp', '/plantpicture/p1/varinat/4.webp', ARRAY['/plantpicture/p1/5.webp', '/plantpicture/p1/varinat/4.webp', '/plantpicture/p1/6.webp', '/plantpicture/p1/7.webp', '/plantpicture/p1/8.webp']::TEXT[], 'Best Seller', 4.9, 42, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p2', 'Two-Tone Pink & Green Cedar Bonsai', 'p2', 'Artificial Bonsai', 'Artistic dual-tiered bonsai with vibrant pink top canopy and lush green lower cedar foliage set in a modern square pot.', 'Dual-canopy pink & green cedar leaves', 99, '/plantpicture/p2/2.webp', '/plantpicture/p2/variant/3.webp', ARRAY['/plantpicture/p2/2.webp', '/plantpicture/p2/variant/3.webp', '/plantpicture/p2/3.webp', '/plantpicture/p2/4.webp']::TEXT[], 'Popular', 4.8, 35, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p3', 'Purple Bougainvillea Shrub', 'p3', 'Flower Bushes', 'Full, leafy bougainvillea bush with delicate magenta-purple petals nestling amidst dark green botanical leaves.', 'Lush indoor flowering accent', 99, '/plantpicture/p3/15.webp', '/plantpicture/p3/variant/6.webp', ARRAY['/plantpicture/p3/15.webp', '/plantpicture/p3/variant/6.webp', '/plantpicture/p3/16.webp', '/plantpicture/p3/17.webp', '/plantpicture/p3/18.webp', '/plantpicture/p3/19.webp']::TEXT[], 'Trending', 5.0, 29, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p4', 'Golden Blossom Flower Bush', 'p4', 'Flower Bushes', 'Radiant yellow marigold blossom bush bringing warmth and vibrant sunshine aesthetics to any desk or countertop.', 'Vibrant sunshine yellow blooms', 99, '/plantpicture/p4/9.webp', '/plantpicture/p4/variant/5.webp', ARRAY['/plantpicture/p4/9.webp', '/plantpicture/p4/variant/5.webp', '/plantpicture/p4/10.webp', '/plantpicture/p4/11.webp', '/plantpicture/p4/12.webp', '/plantpicture/p4/13.webp', '/plantpicture/p4/14.webp']::TEXT[], NULL, 4.7, 18, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p5', 'Orange Calla Lily Grass Shrub', 'p5', 'Flower Plants and Pots', 'Slender green ornamental grass stems topped with graceful orange calla lily buds in a textured white pot.', 'Elegant vertical calla lily stems', 99, '/plantpicture/p5/21.webp', '/plantpicture/p5/variant/7.webp', ARRAY['/plantpicture/p5/21.webp', '/plantpicture/p5/variant/7.webp', '/plantpicture/p5/20.webp', '/plantpicture/p5/22.webp', '/plantpicture/p5/23.webp', '/plantpicture/p5/24.webp']::TEXT[], 'New Arrival', 4.9, 31, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p6', 'Pink Trumpet Lily Bush', 'p6', 'Flower Bushes', 'Graceful pink trumpet lilies standing tall among rich olive-green foliage in a minimal matte white vessel.', 'Charming pink lily blossoms', 99, '/plantpicture/p6/25.webp', '/plantpicture/p6/variant/8.webp', ARRAY['/plantpicture/p6/25.webp', '/plantpicture/p6/variant/8.webp', '/plantpicture/p6/26.webp', '/plantpicture/p6/27.webp', '/plantpicture/p6/28.webp']::TEXT[], NULL, 4.8, 22, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p7', 'Yellow Lotus Blossom Shrub', 'p7', 'Flower Bushes', 'Vibrant yellow lotus flower arrangement nestled in dense pointed green leaves and housed in a modern white pot.', 'Vibrant yellow lotus flowers', 99, '/plantpicture/p7/30.webp', '/plantpicture/p7/variant/9.webp', ARRAY['/plantpicture/p7/30.webp', '/plantpicture/p7/variant/9.webp', '/plantpicture/p7/29.webp', '/plantpicture/p7/46.webp']::TEXT[], NULL, 4.9, 27, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p8', 'Red Rose Topiary Shrub', 'p8', 'Flower Bushes', 'Sculpted two-tier pine topiary dotted with delicate red miniature rosebuds, anchored in a white ribbed container.', 'Sculpted red rose topiary', 99, '/plantpicture/p8/33.webp', '/plantpicture/p8/variant/10.webp', ARRAY['/plantpicture/p8/33.webp', '/plantpicture/p8/variant/10.webp', '/plantpicture/p8/31.webp', '/plantpicture/p8/32.webp', '/plantpicture/p8/34.webp', '/plantpicture/p8/35.webp', '/plantpicture/p8/36.webp']::TEXT[], 'Featured', 5.0, 54, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p9', 'Golden Sunflower Shrub', 'p9', 'Flower Bushes', 'Cheerful bright yellow sunflowers with feather fern green fronds set in a classic white square base.', 'Bright sunflower tabletop arrangement', 99, '/plantpicture/p9/37.webp', '/plantpicture/p9/38.webp', ARRAY['/plantpicture/p9/37.webp', '/plantpicture/p9/38.webp', '/plantpicture/p9/39.webp', '/plantpicture/p9/40.webp', '/plantpicture/p9/41.webp']::TEXT[], NULL, 4.6, 19, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p10', 'Variegated Agave Greenery', 'p10', 'Flower Plants and Pots', 'Lush yellow-tipped agave leaves delivering a clean architectural look for modern desks in a minimalist white square pot.', 'Clean yellow-tipped architectural greenery', 99, '/plantpicture/p10/44.webp', '/plantpicture/p10/varinat/11.webp', ARRAY['/plantpicture/p10/44.webp', '/plantpicture/p10/varinat/11.webp', '/plantpicture/p10/42.webp', '/plantpicture/p10/43.webp']::TEXT[], NULL, 4.8, 25, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p11', 'Red Cherry Berry Bonsai', 'p11', 'Artificial Bonsai', 'Miniature artificial red fruit cherry tree with polished red cherries and detailed dark wooden trunk in a fluted white dish.', 'Vibrant red cherry bonsai accent', 99, '/plantpicture/p11/45.webp', '/plantpicture/p11/variant/12.webp', ARRAY['/plantpicture/p11/45.webp', '/plantpicture/p11/variant/12.webp']::TEXT[], 'Limited Edition', 4.9, 33, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p12', 'Vibrant Pink Leaf Bush', 'p12', 'Flower Bushes', 'Vibrant pink floral leaf foliage bush in a smooth white tabletop cylinder pot.', 'Vibrant pink leaf foliage', 99, '/plantpicture/p12/51.webp', '/plantpicture/p12/variant/14.webp', ARRAY['/plantpicture/p12/51.webp', '/plantpicture/p12/variant/14.webp', '/plantpicture/p12/47.webp', '/plantpicture/p12/48.webp', '/plantpicture/p12/49.webp', '/plantpicture/p12/50.webp']::TEXT[], NULL, 4.8, 28, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p13', 'Crescent Moon Purple Topiary', 'p13', 'Artificial Bonsai', 'Artfully shaped crescent moon bonsai topiary featuring dense green needles accented with purple blossoms in a wide fluted bowl.', 'Unique crescent moon artistic topiary', 99, '/plantpicture/p13/57.webp', '/plantpicture/p13/variant/18.webp', ARRAY['/plantpicture/p13/57.webp', '/plantpicture/p13/variant/18.webp', '/plantpicture/p13/58.webp', '/plantpicture/p13/59.webp', '/plantpicture/p13/60.webp', '/plantpicture/p13/61.webp', '/plantpicture/p13/62.webp']::TEXT[], 'Top Seller', 5.0, 47, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p14', 'Red Blossom Pine Shrub', 'p14', 'Flower Bushes', 'Feathery green pine bush studded with bright coral-red blossoms in a square white planter.', 'Feathery green pine with red accents', 99, '/plantpicture/p14/63.webp', '/plantpicture/p14/variant/19.webp', ARRAY['/plantpicture/p14/63.webp', '/plantpicture/p14/variant/19.webp', '/plantpicture/p14/64.webp', '/plantpicture/p14/65.webp', '/plantpicture/p14/66.webp', '/plantpicture/p14/67.webp']::TEXT[], NULL, 4.7, 16, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p15', 'Blue Bud Twin-Stem Greenery', 'p15', 'Flower Plants and Pots', 'Double trunk artificial jasmine plant with lush green leaves and blue bud accents in a white square pot.', 'Double stem blue bud foliage', 99, '/plantpicture/p15/69.webp', '/plantpicture/p15/variant/20.webp', ARRAY['/plantpicture/p15/69.webp', '/plantpicture/p15/variant/20.webp', '/plantpicture/p15/68.webp', '/plantpicture/p15/70.webp', '/plantpicture/p15/71.webp']::TEXT[], NULL, 4.9, 30, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p16', 'Pink Cypress Cedar Topiary', 'p16', 'Artificial Bonsai', 'Vertical tiered cypress topiary with pink tips standing gracefully in a metallic bronze container.', 'Pink cypress topiary', 99, '/plantpicture/p16/56.webp', '/plantpicture/p16/variant/17.webp', ARRAY['/plantpicture/p16/56.webp', '/plantpicture/p16/variant/17.webp', '/plantpicture/p16/54.webp', '/plantpicture/p16/55.webp']::TEXT[], NULL, 4.8, 21, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p17', 'White Star Bud Mint Shrub', 'p17', 'Flower Plants and Pots', 'Cute bushy mint foliage with tiny white star buds presented in a chic faceted geometric teal pot.', 'Faceted teal pot with star bud greenery', 99, '/plantpicture/p17/53.webp', '/plantpicture/p17/variant/16.webp', ARRAY['/plantpicture/p17/53.webp', '/plantpicture/p17/variant/16.webp']::TEXT[], NULL, 4.9, 23, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p18', 'Twin-Ball Grass Topiary', 'p18', 'Artificial Bonsai', 'Architectural twin sphere grass topiary tree with rich dark trunk in a white ceramic vase.', 'Dual sphere grass topiary', 99, '/plantpicture/p18/52.webp', '/plantpicture/p18/variant/15.webp', ARRAY['/plantpicture/p18/52.webp', '/plantpicture/p18/variant/15.webp']::TEXT[], NULL, 4.8, 34, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('p19', 'Japanese Cedar Pine Bonsai', 'p19', 'Artificial Bonsai', 'Classic asymmetrical Japanese pine bonsai with detailed gnarled trunk in a traditional footed white ceramic bonsai pot.', 'Traditional Japanese cedar bonsai', 99, '/plantpicture/p19/1.webp', '/plantpicture/p19/variant/2.webp', ARRAY['/plantpicture/p19/1.webp', '/plantpicture/p19/variant/2.webp']::TEXT[], 'Premium Selection', 5.0, 62, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p1', '5 FT Golden Yellow Blossom Tree', 'ft-p1', 'Trees & Plants', 'Magnificent 5-foot artificial yellow blossom tree featuring lush, vibrant floral clusters and a textured natural-look dark trunk in a fluted white ceramic pot.', '5 FT statement tree with realistic yellow blossoms', 99, '/plantpicture/1.jpg.webp', '/plantpicture/42.webp', ARRAY['/plantpicture/1.jpg.webp', '/plantpicture/42.webp', '/plantpicture/43.webp']::TEXT[], 'Grand Statement', 4.9, 38, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p2', 'Cascading Peach Rose Hanging Vine', 'ft-p2', 'Hanging', 'Lush trailing artificial vine with delicate peach rose blossoms and dense variegated green leaves, ideal for wall hanging and balcony railings.', 'Trailing peach roses for walls & balconies', 99, '/plantpicture/2.jpg.webp', '/plantpicture/2.jpg.webp', ARRAY['/plantpicture/2.jpg.webp']::TEXT[], 'Best Seller', 4.8, 26, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p3', '5 FT Autumn Orange Maple Tree', 'ft-p3', 'Trees & Plants', 'Elegant 5-foot Japanese red-orange maple foliage tree with lifelike veined leaves and a realistic textured hardwood trunk in a geometric pot.', 'Warm autumn maple foliage with natural trunk', 99, '/plantpicture/3.jpg.webp', '/plantpicture/3.jpg.webp', ARRAY['/plantpicture/3.jpg.webp']::TEXT[], 'Trending', 4.9, 31, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p4', 'Purple Lotus Blossom Stems in White Pot', 'ft-p4', 'Flower Plants and Pots', 'Refined purple lotus flower buds with broad lotus lily pads planted in sleek fluted white ceramic cylinder pots.', 'Refined purple lotus flower buds with broad lily pads', 99, '/plantpicture/4.jpg.webp', '/plantpicture/4.jpg.webp', ARRAY['/plantpicture/4.jpg.webp']::TEXT[], NULL, 4.7, 19, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p5', 'Cascading Red & White Rose Hanging Vine', 'ft-p5', 'Hanging', 'Cascading two-tone red and white rose garland with dense ivy-style green vines for wall accent and pergolas.', 'Dual-tone red & white rose cascading garland', 99, '/plantpicture/5.jpg.webp', '/plantpicture/5.jpg.webp', ARRAY['/plantpicture/5.jpg.webp']::TEXT[], NULL, 4.8, 24, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p6', 'Cascading Yellow Rose Hanging Creeper', 'ft-p6', 'Hanging', 'Bright sunny yellow rose hanging floral vine with trailing stems and dense realistic leaves for high shelves or arches.', 'Sunny yellow rose trailing creeper', 99, '/plantpicture/6.jpg.webp', '/plantpicture/6.jpg.webp', ARRAY['/plantpicture/6.jpg.webp']::TEXT[], NULL, 4.9, 28, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p7', 'Cascading Cream White Daisy Hanging Vine', 'ft-p7', 'Hanging', 'Romantic cascading cream white daisy hanging plant with lush leafy vines flowing gracefully downwards.', 'Delicate white daisy floral cascade', 99, '/plantpicture/7.jpg.webp', '/plantpicture/7.jpg.webp', ARRAY['/plantpicture/7.jpg.webp']::TEXT[], NULL, 4.7, 22, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p8', 'Cascading Orange Flame Flower Hanging Creeper', 'ft-p8', 'Hanging', 'Exotic flame-orange flower creeper with long hanging stems and vibrant florets for patio or entryway walls.', 'Vibrant orange florets on trailing stems', 99, '/plantpicture/8.jpg.webp', '/plantpicture/8.jpg.webp', ARRAY['/plantpicture/8.jpg.webp']::TEXT[], NULL, 4.8, 20, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p9', 'Cascading Crimson Pink Gerbera Hanging Vine', 'ft-p9', 'Hanging', 'Trailing crimson pink gerbera daisy flower creeper with rich petal blossoms and thick leafy vines.', 'Rich pink gerbera blossoms with lush trailing greenery', 99, '/plantpicture/9.jpg.webp', '/plantpicture/9.jpg.webp', ARRAY['/plantpicture/9.jpg.webp']::TEXT[], NULL, 4.9, 25, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p10', 'Cascading Crimson Red Carnation Hanging Creeper', 'ft-p10', 'Hanging', 'Dramatic cascading deep crimson red carnation vine with dense floral clusters and cascading green tendrils.', 'Dramatic crimson red carnation cascade', 99, '/plantpicture/10.jpg.webp', '/plantpicture/10.jpg.webp', ARRAY['/plantpicture/10.jpg.webp']::TEXT[], 'Popular', 5.0, 32, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p11', 'Cascading Peach Carnation Hanging Vine', 'ft-p11', 'Hanging', 'Soft peach carnation pom-pom hanging vine with cascading green foliage, perfect for adding warmth to walls and hanging baskets.', 'Soft peach carnation floral vine', 99, '/plantpicture/11.jpg.webp', '/plantpicture/11.jpg.webp', ARRAY['/plantpicture/11.jpg.webp']::TEXT[], NULL, 4.8, 21, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p12', 'Bird of Paradise Heliconia in Pot', 'ft-p12', 'Flower Plants and Pots', 'Tropical Strelitzia Bird of Paradise with upright architectural lance leaves and orange-red flower spike in a white ceramic vase.', 'Architectural tropical heliconia with flower spike', 99, '/plantpicture/12.jpg.webp', '/plantpicture/12.jpg.webp', ARRAY['/plantpicture/12.jpg.webp']::TEXT[], 'Exotic', 4.9, 37, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p13', '5 FT Crimson Red Cherry Blossom Tree', 'ft-p13', 'Trees & Plants', 'Striking 5-foot oriental cherry blossom tree with rich crimson-red blossoms cascading over sculpted multi-stem trunks.', 'Breathtaking 5 FT red cherry blossom tree', 99, '/plantpicture/13.jpg.webp', '/plantpicture/44.webp', ARRAY['/plantpicture/13.jpg.webp', '/plantpicture/44.webp', '/plantpicture/45.webp']::TEXT[], 'Top Pick', 5.0, 44, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p14', '5 FT Pink Bougainvillea Tree', 'ft-p14', 'Trees & Plants', 'Eye-catching 5-foot pink bougainvillea floral tree with layered petal canopies and slender timber stems in a decorative pot.', 'Vibrant pink bougainvillea floral tree', 99, '/plantpicture/14.jpg.webp', '/plantpicture/14.jpg.webp', ARRAY['/plantpicture/14.jpg.webp']::TEXT[], NULL, 4.9, 29, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p15', '5 FT Japanese Red Maple Tree', 'ft-p15', 'Trees & Plants', 'Artisanal 5-foot Japanese acer palmatum maple tree with finely serrated burgundy-red leaves and authentic branching structure.', 'Acer palmatum Japanese red maple', 99, '/plantpicture/15.jpg.webp', '/plantpicture/46.webp', ARRAY['/plantpicture/15.jpg.webp', '/plantpicture/46.webp', '/plantpicture/47.webp']::TEXT[], 'Premium', 5.0, 51, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p16', '5 FT Mediterranean Faux Olive Tree', 'ft-p16', 'Trees & Plants', 'Timeless 5-foot Mediterranean olive tree featuring delicate silvery-green willow leaves, realistic faux olives, and a slender natural trunk.', 'Silvery-green leaves with realistic faux olives', 99, '/plantpicture/16.jpg.webp', '/plantpicture/49.webp', ARRAY['/plantpicture/16.jpg.webp', '/plantpicture/49.webp']::TEXT[], 'Best Seller', 4.9, 63, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p17', '5 FT Fiddle Leaf Fig Tree', 'ft-p17', 'Trees & Plants', 'Statement 5-foot Ficus Lyrata fiddle-leaf fig tree with broad violin-shaped deep emerald leaves and realistic textured trunk.', 'Broad fiddle leaves with organic trunk texture', 99, '/plantpicture/17.jpg.webp', '/plantpicture/38.webp', ARRAY['/plantpicture/17.jpg.webp', '/plantpicture/38.webp']::TEXT[], 'Customer Favorite', 5.0, 78, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p18', '5 FT Purple Flowering Bougainvillea Tree', 'ft-p18', 'Trees & Plants', 'Dramatic 5-foot purple bougainvillea floral tree with rich violet petal blooms climbing along a dark wood-textured trunk.', 'Rich violet bougainvillea floral tree', 99, '/plantpicture/18.jpg.webp', '/plantpicture/18.jpg.webp', ARRAY['/plantpicture/18.jpg.webp']::TEXT[], NULL, 4.8, 27, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p19', '5 FT Natural Cane Bamboo Tree', 'ft-p19', 'Trees & Plants', 'Zen-inspired 5-foot natural cane bamboo tree featuring slender green culms and feathery bamboo leaf sprays in a nursery pot.', 'Natural bamboo culms with feathery foliage', 99, '/plantpicture/19.jpg.webp', '/plantpicture/19.jpg.webp', ARRAY['/plantpicture/19.jpg.webp']::TEXT[], NULL, 4.8, 35, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p20', '5 FT Tropical Areca Palm Tree', 'ft-p20', 'Trees & Plants', 'Tropical 5-foot Areca butterfly palm tree with arching feathered fronds and multi-stem bamboo canes in a modern white pot.', 'Feathered palm fronds for tropical aesthetics', 99, '/plantpicture/20.jpg.webp', '/plantpicture/48.webp', ARRAY['/plantpicture/20.jpg.webp', '/plantpicture/48.webp']::TEXT[], 'Tropical Luxury', 4.9, 42, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p21', '5 FT Evergreen Cypress Cedar Tree', 'ft-p21', 'Trees & Plants', 'Architectural 5-foot columnar cypress cedar tree with dense dark green foliage needle clusters in a woven textured pot.', 'Architectural columnar evergreen cypress', 99, '/plantpicture/21.jpg.webp', '/plantpicture/40.webp', ARRAY['/plantpicture/21.jpg.webp', '/plantpicture/40.webp']::TEXT[], NULL, 4.9, 36, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p22', '5 FT Tuscan Lemon Fruit Tree', 'ft-p22', 'Trees & Plants', 'Vibrant 5-foot Mediterranean citrus lemon tree laden with lifelike yellow lemons and glossy dark green foliage in a round white pot.', 'Lush citrus foliage with realistic yellow lemons', 99, '/plantpicture/22.jpg.webp', '/plantpicture/50.webp', ARRAY['/plantpicture/22.jpg.webp', '/plantpicture/50.webp']::TEXT[], 'Best Seller', 5.0, 59, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p23', 'Yellow Lotus Blossom Stems in Fluted Pot', 'ft-p23', 'Flower Plants and Pots', 'Sunny yellow lotus bloom arrangement featuring closed buds and open petals in an elegant tall fluted ceramic planter.', 'Bright yellow lotus blooms in fluted planter', 99, '/plantpicture/23.jpg.webp', '/plantpicture/23.jpg.webp', ARRAY['/plantpicture/23.jpg.webp']::TEXT[], NULL, 4.8, 20, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p24', 'Tropical Broadleaf Plant in Pot', 'ft-p24', 'Flower Plants and Pots', 'Dense dark emerald broadleaf indoor foliage plant with ruffled edges anchored in a modern grey bowl pot.', 'Ruffled broad emerald leaves in grey pot', 99, '/plantpicture/24.jpg.webp', '/plantpicture/24.jpg.webp', ARRAY['/plantpicture/24.jpg.webp']::TEXT[], NULL, 4.7, 17, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p25', 'Purple Striped Calathea Peacock Plant in Pot', 'ft-p25', 'Flower Plants and Pots', 'Dramatic Calathea peacock plant with deep purple underside and patterned foliage set in an octagonal white planter.', 'Calathea peacock foliage with purple underside', 99, '/plantpicture/25.jpg.webp', '/plantpicture/25.jpg.webp', ARRAY['/plantpicture/25.jpg.webp']::TEXT[], 'Popular', 4.9, 34, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p26', 'Glossy Ficus Tropical Plant in Pot', 'ft-p26', 'Flower Plants and Pots', 'Upright artificial tropical foliage plant with glossy spoon-shaped green leaves in a minimalist grey pot.', 'Glossy rounded tropical foliage', 99, '/plantpicture/26.jpg.webp', '/plantpicture/26.jpg.webp', ARRAY['/plantpicture/26.jpg.webp']::TEXT[], NULL, 4.7, 15, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p27', '5 FT Majestic Coconut Palm Tree', 'ft-p27', 'Trees & Plants', 'Authentic 5-foot tropical coconut feather palm tree with sculpted natural-fibre trunk and sprawling green fronds.', 'Lifelike coconut palm with natural fiber trunk', 99, '/plantpicture/27.jpg.webp', '/plantpicture/27.jpg.webp', ARRAY['/plantpicture/27.jpg.webp']::TEXT[], NULL, 4.9, 39, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p28', 'Red-Veined Caladium Foliage Plant in Pot', 'ft-p28', 'Flower Plants and Pots', 'Gorgeous heart-shaped Caladium plant with vibrant red vein network and emerald borders in an embossed white ceramic pot.', 'Heart-shaped leaves with vivid red veins', 99, '/plantpicture/28.jpg.webp', '/plantpicture/41.webp', ARRAY['/plantpicture/28.jpg.webp', '/plantpicture/41.webp']::TEXT[], 'Staff Pick', 5.0, 48, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p29', 'Pink Spotted Syngonium in Pot', 'ft-p29', 'Flower Plants and Pots', 'Heart-leaf Syngonium arrowhead plant dotted with playful pink splash variegation in a modern slate grey container.', 'Playful pink splash variegation on arrowhead leaves', 99, '/plantpicture/29.jpg.webp', '/plantpicture/29.jpg.webp', ARRAY['/plantpicture/29.jpg.webp']::TEXT[], NULL, 4.8, 26, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p30', 'Variegated Dieffenbachia Cane Plant in Pot', 'ft-p30', 'Flower Plants and Pots', 'Lush Dumb Cane Dieffenbachia with lime and cream marbled leaf patterns rising from realistic segmented stems.', 'Lime & cream marbled leaf patterns', 99, '/plantpicture/30.jpg.webp', '/plantpicture/30.jpg.webp', ARRAY['/plantpicture/30.jpg.webp']::TEXT[], NULL, 4.9, 31, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p31', '5 FT Golden Variegated Ficus Tree', 'ft-p31', 'Trees & Plants', 'Full and bushy 5-foot ficus tree with yellow-variegated edge leaves and sturdy wooden trunk in a fluted white ceramic pot.', 'Yellow-edged variegated ficus tree', 99, '/plantpicture/31.jpg.webp', '/plantpicture/31.jpg.webp', ARRAY['/plantpicture/31.jpg.webp']::TEXT[], NULL, 4.8, 33, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p32', '5 FT Dracaena Yucca Palm Tree', 'ft-p32', 'Trees & Plants', 'Sleek architectural 5-foot Dracaena spike plant with tall sword-shaped pointed foliage radiating from a central cane.', 'Sword-shaped spiked palm leaves', 99, '/plantpicture/32.jpg.webp', '/plantpicture/32.jpg.webp', ARRAY['/plantpicture/32.jpg.webp']::TEXT[], NULL, 4.9, 41, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p33', 'Ficus Elastica Rubber Plant in Pot', 'ft-p33', 'Flower Plants and Pots', 'Broadleaf Ficus Elastica rubber tree with thick white-bordered variegated leaves in a contemporary charcoal pot.', 'Thick white-bordered variegated rubber foliage', 99, '/plantpicture/33.jpg.webp', '/plantpicture/33.jpg.webp', ARRAY['/plantpicture/33.jpg.webp']::TEXT[], NULL, 4.8, 24, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p34', 'Potted Peace Lily Spathiphyllum in Pot', 'ft-p34', 'Flower Plants and Pots', 'Elegant dark green peace lily foliage with slender arching leaves in a sleek black ceramic pot.', 'Arching emerald peace lily leaves', 99, '/plantpicture/34.jpg.webp', '/plantpicture/34.jpg.webp', ARRAY['/plantpicture/34.jpg.webp']::TEXT[], NULL, 4.7, 22, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p35', 'Split-Leaf Monstera Deliciosa in Pot', 'ft-p35', 'Flower Plants and Pots', 'Classic split-leaf Swiss cheese Monstera Deliciosa plant with fenestrated glossy leaves in a dark grey pot.', 'Iconic fenestrated Swiss cheese leaves', 99, '/plantpicture/35.jpg.webp', '/plantpicture/35.jpg.webp', ARRAY['/plantpicture/35.jpg.webp']::TEXT[], 'Bestseller', 5.0, 65, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p36', 'Giant Elephant Ear Alocasia in Pot', 'ft-p36', 'Flower Plants and Pots', 'Architectural Alocasia elephant ear plant with large upright paddle leaves in an elegant white textured pot.', 'Upright paddle-shaped elephant ear foliage', 99, '/plantpicture/36.jpg.webp', '/plantpicture/39.webp', ARRAY['/plantpicture/36.jpg.webp', '/plantpicture/39.webp']::TEXT[], NULL, 4.9, 38, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('ft-p37', 'Emerald Marble Evergreen in Pot', 'ft-p37', 'Flower Plants and Pots', 'Dense speckled Chinese Evergreen plant with dramatic dark green and yellow mottled camouflage patterns in a grey bowl pot.', 'Speckled camouflage pattern foliage', 99, '/plantpicture/37.jpg.webp', '/plantpicture/37.jpg.webp', ARRAY['/plantpicture/37.jpg.webp']::TEXT[], NULL, 4.8, 21, 50, true, true)
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
  in_stock = EXCLUDED.in_stock;

