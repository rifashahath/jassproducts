-- ============================================================================
-- P11 — Add the 'Flower Bunches' category and its 9 hand-assembled products.
--
-- New storefront category (cat-6) with product imagery staged under
-- public/plantpicture/flower bunches/. Pulls double duty with the image-paths
-- test suite: every image referenced below is a real file.
-- ============================================================================

INSERT INTO public.categories (id, name, slug, description, image, display_order, status)
VALUES ('cat-6', 'Flower Bunches', 'flower-bunches', 'Hand-assembled cut-stem artificial flower bunches for vases', '/plantpicture/flower bunches/1/1.png', 6, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status;

-- fb-01
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-01', 'Flower Bunch 01', 'fb-01', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/1/1.png', '/plantpicture/flower bunches/1/fd79bb70-5c60-4cfa-9833-d44f3a789cc6.png', ARRAY['/plantpicture/flower bunches/1/1.png', '/plantpicture/flower bunches/1/2.png', '/plantpicture/flower bunches/1/30.png', '/plantpicture/flower bunches/1/31.png', '/plantpicture/flower bunches/1/fd79bb70-5c60-4cfa-9833-d44f3a789cc6.png']::TEXT[], NULL, 4.9, 14, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-02
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-02', 'Flower Bunch 02', 'fb-02', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/2/4.png', '/plantpicture/flower bunches/2/c3c4ff4f-67db-48e3-9faf-83d6168d6151.png', ARRAY['/plantpicture/flower bunches/2/4.png', '/plantpicture/flower bunches/2/5.png', '/plantpicture/flower bunches/2/6.png', '/plantpicture/flower bunches/2/7.png', '/plantpicture/flower bunches/2/8.png', '/plantpicture/flower bunches/2/c3c4ff4f-67db-48e3-9faf-83d6168d6151.png']::TEXT[], NULL, 4.9, 12, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-03
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-03', 'Flower Bunch 03', 'fb-03', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/3/10.png', '/plantpicture/flower bunches/3/92d9f43e-9b2e-42c9-8546-ad33e70175b6.png', ARRAY['/plantpicture/flower bunches/3/9.png', '/plantpicture/flower bunches/3/10.png', '/plantpicture/flower bunches/3/11.png', '/plantpicture/flower bunches/3/12.png', '/plantpicture/flower bunches/3/92d9f43e-9b2e-42c9-8546-ad33e70175b6.png']::TEXT[], NULL, 4.9, 9, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-04
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-04', 'Flower Bunch 04', 'fb-04', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/4/13.png', '/plantpicture/flower bunches/4/b6c50585-3312-4bc0-bb4f-81b52ecb70e6.png', ARRAY['/plantpicture/flower bunches/4/13.png', '/plantpicture/flower bunches/4/14.png', '/plantpicture/flower bunches/4/15.png', '/plantpicture/flower bunches/4/16.png', '/plantpicture/flower bunches/4/17.png', '/plantpicture/flower bunches/4/18.png', '/plantpicture/flower bunches/4/b6c50585-3312-4bc0-bb4f-81b52ecb70e6.png']::TEXT[], NULL, 4.9, 17, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
-- fb-05
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-05', 'Flower Bunch 05', 'fb-05', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/5/19.png', '/plantpicture/flower bunches/5/e40191e0-0017-4c68-851e-2110f7efbe80.png', ARRAY['/plantpicture/flower bunches/5/19.png', '/plantpicture/flower bunches/5/20.png', '/plantpicture/flower bunches/5/21.png', '/plantpicture/flower bunches/5/22.png', '/plantpicture/flower bunches/5/e40191e0-0017-4c68-851e-2110f7efbe80.png']::TEXT[], NULL, 4.9, 11, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-06
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-06', 'Flower Bunch 06', 'fb-06', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/6/23.png', '/plantpicture/flower bunches/6/ee408db0-bf29-489f-874c-5c376e8470b4.png', ARRAY['/plantpicture/flower bunches/6/23.png', '/plantpicture/flower bunches/6/24.png', '/plantpicture/flower bunches/6/25.png', '/plantpicture/flower bunches/6/27.png', '/plantpicture/flower bunches/6/28.png', '/plantpicture/flower bunches/6/29.png', '/plantpicture/flower bunches/6/ee408db0-bf29-489f-874c-5c376e8470b4.png']::TEXT[], NULL, 4.9, 13, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
-- fb-07
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-07', 'Flower Bunch 07', 'fb-07', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/7/26.png', '/plantpicture/flower bunches/7/2771ff0b-0bdd-4693-8798-8a0472b8155a.png', ARRAY['/plantpicture/flower bunches/7/26.png', '/plantpicture/flower bunches/7/32.png', '/plantpicture/flower bunches/7/2771ff0b-0bdd-4693-8798-8a0472b8155a.png']::TEXT[], NULL, 4.9, 8, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-08
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-08', 'Flower Bunch 08', 'fb-08', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/8/34.png', '/plantpicture/flower bunches/8/1ddc8e17-4cfd-474e-8bd3-30fa83092530.png', ARRAY['/plantpicture/flower bunches/8/34.png', '/plantpicture/flower bunches/8/35.png', '/plantpicture/flower bunches/8/36.png', '/plantpicture/flower bunches/8/37.png', '/plantpicture/flower bunches/8/1ddc8e17-4cfd-474e-8bd3-30fa83092530.png']::TEXT[], NULL, 4.9, 10, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;

-- fb-09
INSERT INTO public.products (id, name, slug, category, description, note, price, image, hover_image, gallery, badge, rating, reviews_count, stock, in_stock, is_featured)
VALUES ('fb-09', 'Flower Bunch 09', 'fb-09', 'Flower Bunches', 'A lush hand-assembled artificial flower bunch with vibrant, long-lasting petals. Ready to display in your own vase or planter.', 'Hand-assembled artificial flower bunch', 99, '/plantpicture/flower bunches/9/38.png', '/plantpicture/flower bunches/9/9c9c4bd1-1570-4360-aa07-306df3183ec1.png', ARRAY['/plantpicture/flower bunches/9/38.png', '/plantpicture/flower bunches/9/39.png', '/plantpicture/flower bunches/9/40.png', '/plantpicture/flower bunches/9/41.png', '/plantpicture/flower bunches/9/42.png', '/plantpicture/flower bunches/9/9c9c4bd1-1570-4360-aa07-306df3183ec1.png']::TEXT[], NULL, 4.9, 15, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category,
  description = EXCLUDED.description, note = EXCLUDED.note, price = EXCLUDED.price,
  image = EXCLUDED.image, hover_image = EXCLUDED.hover_image, gallery = EXCLUDED.gallery,
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;
  rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, in_stock = EXCLUDED.in_stock;