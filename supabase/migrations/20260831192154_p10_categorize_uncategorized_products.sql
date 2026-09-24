-- ============================================================================
-- P10 — Re-categorize products whose `category` was overwritten to
-- 'Uncategorized'.
--
-- Measured production state: 20 rows in public.products carry
-- `category = 'Uncategorized'`, so the storefront category slider counted
-- "All Botanicals: 57" while the five real categories summed to 37 — every
-- Uncategorized row matched no category. The mapping below restores each
-- product's intended category from the authoritative seed
-- (supabase/seed_56_categorized_products.sql), classified by product type:
--
--   Bonsai / worked-topiary forms        -> Artificial Bonsai
--   Bushes, shrubs and flowering mounts  -> Flower Bushes
--   Potted greenery, lotus, grass forms  -> Flower Plants and Pots
--
-- The junk admin test row (name 'jhg') is intentionally left Uncategorized so
-- it stays visible and can be deleted in Admin > Products.
-- ============================================================================

UPDATE public.products SET category = 'Artificial Bonsai' WHERE id IN (
  'p1',  -- Purple Blossom Bonsai Tree
  'p2',  -- Two-Tone Pink & Green Cedar Bonsai
  'p11', -- Red Cherry Berry Bonsai
  'p13', -- Crescent Moon Purple Topiary
  'p16', -- Pink Cypress Cedar Topiary
  'p18', -- Twin-Ball Grass Topiary
  'p19'  -- Japanese Cedar Pine Bonsai
);

UPDATE public.products SET category = 'Flower Bushes' WHERE id IN (
  'p3',  -- Purple Bougainvillea Shrub
  'p4',  -- Golden Blossom Flower Bush
  'p6',  -- Pink Trumpet Lily Bush
  'p7',  -- Yellow Lotus Blossom Shrub
  'p8',  -- Red Rose Topiary Shrub
  'p9',  -- Golden Sunflower Shrub
  'p12', -- Vibrant Pink Leaf Bush
  'p14'  -- Red Blossom Pine Shrub
);

UPDATE public.products SET category = 'Flower Plants and Pots' WHERE id IN (
  'p5',  -- Orange Calla Lily Grass Shrub
  'p10', -- Variegated Agave Greenery
  'p15', -- Blue Bud Twin-Stem Greenery
  'p17'  -- White Star Bud Mint Shrub
);
