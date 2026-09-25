/**
 * Product Data Model & Catalog Configuration for Jass Products.
 * Single source of truth for beauty, skincare, health, and hair care items.
 */

import { supabase, isSupabaseConfigured } from "./supabase.ts";

export type Product = {
  id: string | number;
  sku?: string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  rating?: number;
  reviewsCount?: number;
  image: string;
  image3D?: string;
  hoverImage?: string;
  gallery?: string[];
  note?: string;
  description?: string;
  inStock: boolean;
  stockQuantity?: number;
  badge?: string;
  swatchCode?: string;
  volume?: string;
};

export function getProductSlug(product: { id: string | number; name?: string; slug?: string }): string {
  if (product.slug && product.slug.trim()) return product.slug.trim();
  if (product.name) {
    return product.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return String(product.id);
}

export const products: Product[] = [
  {
    id: "jp-1",
    name: "Pure Organic Amla Powder",
    slug: "pure-organic-amla-powder",
    category: "HEALTH CARE",
    price: 349.00,
    salePrice: 299.00,
    rating: 4.9,
    reviewsCount: 48,
    image: "/products/amla-powder/main.png",
    hoverImage: "/products/amla-powder/gallery-1.jpg",
    gallery: [
      "/products/amla-powder/main.png",
      "/products/amla-powder/gallery-1.jpg",
      "/products/amla-powder/gallery-2.jpg",
      "/products/amla-powder/gallery-3.jpg",
      "/products/amla-powder/gallery-4.png",
    ],
    description: "Pure shade-dried Indian gooseberry (Amla) powder packed with natural Vitamin C, bioflavonoids, and antioxidants. Supports immune vitality, radiant skin, and natural hair strengthening.",
    note: "Daily health and hair nourishment powder",
    inStock: true,
    stockQuantity: 100,
    badge: "100% Organic",
    volume: "100 G",
    swatchCode: "334 U",
  },
  {
    id: "jp-2",
    name: "Natural Pure Carrot Powder",
    slug: "natural-pure-carrot-powder",
    category: "HEALTH CARE",
    price: 399.00,
    salePrice: 349.00,
    rating: 4.8,
    reviewsCount: 35,
    image: "/products/carrot-powder/main.png",
    hoverImage: "/products/carrot-powder/gallery-1.jpg",
    gallery: [
      "/products/carrot-powder/main.png",
      "/products/carrot-powder/gallery-1.jpg",
      "/products/carrot-powder/gallery-2.jpg",
      "/products/carrot-powder/gallery-3.jpg",
      "/products/carrot-powder/gallery-4.jpg",
    ],
    description: "Premium farm-fresh dehydrated carrot powder rich in provitamin A and carotenoids. Nourishes skin from within, enhances complexion, and promotes cell vitality.",
    note: "Convenient natural carrot goodness",
    inStock: true,
    stockQuantity: 85,
    badge: "Beta-Carotene Rich",
    volume: "100 G",
    swatchCode: "109 U",
  },
  {
    id: "jp-3",
    name: "Nutrient-Rich Beetroot Powder",
    slug: "nutrient-rich-beetroot-powder",
    category: "HEALTH CARE",
    price: 379.00,
    salePrice: 329.00,
    rating: 4.9,
    reviewsCount: 42,
    image: "/products/beetroot-powder/main.png",
    hoverImage: "/products/beetroot-powder/gallery-1.png",
    gallery: [
      "/products/beetroot-powder/main.png",
      "/products/beetroot-powder/gallery-1.png",
      "/products/beetroot-powder/gallery-2.jpg",
      "/products/beetroot-powder/gallery-3.jpg",
      "/products/beetroot-powder/gallery-4.jpg",
    ],
    description: "100% pure ruby beetroot powder teeming with natural dietary nitrates, iron, and betalains. Supports stamina, blood purification, and a natural rosy skin flush.",
    note: "Daily vitality and natural flush",
    inStock: true,
    stockQuantity: 90,
    badge: "Energy & Glow",
    volume: "100 G",
    swatchCode: "209 C",
  },
  {
    id: "jp-4",
    name: "Organic Moringa Leaf Superfood Powder",
    slug: "organic-moringa-leaf-powder",
    category: "HEALTH CARE",
    price: 399.00,
    salePrice: 349.00,
    rating: 4.9,
    reviewsCount: 56,
    image: "/products/moringa-powder/main.png",
    hoverImage: "/products/moringa-powder/gallery-1.png",
    gallery: [
      "/products/moringa-powder/main.png",
      "/products/moringa-powder/gallery-1.png",
      "/products/moringa-powder/gallery-2.png",
      "/products/moringa-powder/gallery-3.jpg",
      "/products/moringa-powder/gallery-4.png",
    ],
    description: "Handpicked organic drumstick leaf (Moringa Oleifera) powder loaded with 90+ nutrients, minerals, amino acids, and iron for sustained clean vitality and holistic immunity.",
    note: "Complete herbal wellness powerhouse",
    inStock: true,
    stockQuantity: 75,
    badge: "Miracle Superfood",
    volume: "100 G",
    swatchCode: "357 C",
  },
  {
    id: "jp-5",
    name: "Herbal Conditioning & Anti-Dandruff Shampoo",
    slug: "herbal-conditioning-anti-dandruff-shampoo",
    category: "HAIR CARE",
    price: 499.00,
    salePrice: 449.00,
    rating: 5.0,
    reviewsCount: 64,
    image: "/products/herbal-shampoo/main.png",
    hoverImage: "/products/herbal-shampoo/gallery-1.png",
    gallery: [
      "/products/herbal-shampoo/main.png",
      "/products/herbal-shampoo/gallery-1.png",
      "/products/herbal-shampoo/gallery-2.jpg",
    ],
    description: "Gentle botanical shampoo formulated with rosemary, neem, shikakai, and soothing aloe to effectively remove dandruff flakes, clarify roots, and restore lustrous hair softness.",
    note: "Sulfate & paraben free formula",
    inStock: true,
    stockQuantity: 120,
    badge: "Best Seller",
    volume: "250 ML",
    swatchCode: "1795 C",
  },
  {
    id: "jp-6",
    name: "Intense Hydrating Night Repair Cream",
    slug: "intense-hydrating-night-repair-cream",
    category: "SKINCARE & CREAMS",
    price: 699.00,
    salePrice: 599.00,
    rating: 4.9,
    reviewsCount: 51,
    image: "/products/night-cream/main.png",
    hoverImage: "/products/night-cream/gallery-1.png",
    gallery: [
      "/products/night-cream/main.png",
      "/products/night-cream/gallery-1.png",
      "/products/night-cream/gallery-2.png",
    ],
    description: "Deeply nourishing overnight barrier restorative treatment enriched with restorative botanicals, ceramides, and natural lipid complexes for waking up to plush, rested skin.",
    note: "Overnight barrier restoration",
    inStock: true,
    stockQuantity: 65,
    badge: "Overnight Renewal",
    volume: "50 G",
    swatchCode: "289 C",
  },
  {
    id: "jp-7",
    name: "Daily Defense Mineral Sunscreen SPF 50",
    slug: "daily-defense-mineral-sunscreen-spf-50",
    category: "SKINCARE & CREAMS",
    price: 549.00,
    salePrice: 499.00,
    rating: 4.8,
    reviewsCount: 39,
    image: "/products/sunscreen/main.png",
    hoverImage: "/products/sunscreen/gallery-1.png",
    gallery: [
      "/products/sunscreen/main.png",
      "/products/sunscreen/gallery-1.png",
      "/products/sunscreen/gallery-2.jpg",
    ],
    description: "Ultra-lightweight, non-greasy broad spectrum sunscreen featuring mineral zinc and botanical antioxidants. Shielding against UVA/UVB rays without leaving any white cast.",
    note: "Zero white-cast mineral protection",
    inStock: true,
    stockQuantity: 80,
    badge: "Broad Spectrum SPF 50",
    volume: "100 ML",
    swatchCode: "115 U",
  },
  {
    id: "jp-8",
    name: "Anti-Pigmentation & Dark Spot Correction Cream",
    slug: "anti-pigmentation-dark-spot-correction-cream",
    category: "SKINCARE & CREAMS",
    price: 649.00,
    salePrice: 579.00,
    rating: 4.9,
    reviewsCount: 58,
    image: "/products/pigmentation-cream/main.jpg",
    hoverImage: "/products/pigmentation-cream/gallery-1.jpg",
    gallery: [
      "/products/pigmentation-cream/main.jpg",
      "/products/pigmentation-cream/gallery-1.jpg",
      "/products/pigmentation-cream/gallery-2.jpg",
    ],
    description: "Targeted brightening and melanin-balancing formula crafted with licorice root, niacinamide, and wild turmeric to visibly fade stubborn sun spots, acne marks, and hyperpigmentation.",
    note: "Clinically inspired botanical actives",
    inStock: true,
    stockQuantity: 70,
    badge: "Spot Corrector",
    volume: "50 G",
    swatchCode: "2310 C",
  },
  {
    id: "jp-9",
    name: "Vitamin C Glow & Radiance Day Cream",
    slug: "vitamin-c-glow-radiance-day-cream",
    category: "SKINCARE & CREAMS",
    price: 599.00,
    salePrice: 529.00,
    rating: 4.9,
    reviewsCount: 44,
    image: "/products/vitamin-c-cream/main.jpg",
    hoverImage: "/products/vitamin-c-cream/gallery-1.jpg",
    gallery: [
      "/products/vitamin-c-cream/main.jpg",
      "/products/vitamin-c-cream/gallery-1.jpg",
      "/products/vitamin-c-cream/gallery-2.jpg",
      "/products/vitamin-c-cream/gallery-3.jpg",
    ],
    description: "Energizing daily moisturizer infused with stable botanical Vitamin C and antioxidant berry oils. Revitalizes dull complexion, shields from oxidative stress, and locks in dewy hydration.",
    note: "Antioxidant day shield and radiance",
    inStock: true,
    stockQuantity: 90,
    badge: "Vitamin C Boost",
    volume: "50 G",
    swatchCode: "137 C",
  },
  {
    id: "jp-10",
    name: "Age-Defying Collagen Peptide Cream",
    slug: "age-defying-collagen-peptide-cream",
    category: "SKINCARE & CREAMS",
    price: 799.00,
    salePrice: 699.00,
    rating: 5.0,
    reviewsCount: 37,
    image: "/products/anti-aging-cream/main.png",
    hoverImage: "/products/anti-aging-cream/gallery-1.png",
    gallery: [
      "/products/anti-aging-cream/main.png",
      "/products/anti-aging-cream/gallery-1.png",
      "/products/anti-aging-cream/gallery-2.png",
    ],
    description: "Luxury youth-preserving sculpting cream enriched with bioactive plant peptides and bakuchiol. Enhances elasticity, smoothens fine lines, and promotes skin firmness.",
    note: "Peptide and bakuchiol firming complex",
    inStock: true,
    stockQuantity: 55,
    badge: "Firm & Lift",
    volume: "50 G",
    swatchCode: "4685 C",
  },
  {
    id: "jp-11",
    name: "Pure Kashmiri Saffron Radiance Gel",
    slug: "pure-kashmiri-saffron-radiance-gel",
    category: "SKINCARE & CREAMS",
    price: 599.00,
    salePrice: 529.00,
    rating: 5.0,
    reviewsCount: 62,
    image: "/products/saffron-gel/main.png",
    hoverImage: "/products/saffron-gel/gallery-1.png",
    gallery: [
      "/products/saffron-gel/main.png",
      "/products/saffron-gel/gallery-1.png",
      "/products/saffron-gel/gallery-2.png",
    ],
    description: "Cooling, water-light therapeutic gel infused with handpicked Kashmiri saffron stigmas and pure organic aloe vera. Calms redness, imparts a luminous glass-skin glow, and hydrates deeply.",
    note: "Pure Mongra grade saffron extract",
    inStock: true,
    stockQuantity: 85,
    badge: "Kashmiri Saffron",
    volume: "100 G",
    swatchCode: "1235 C",
  },
  {
    id: "jp-12",
    name: "Nourishing Herbal Tinted Lip Balm",
    slug: "nourishing-herbal-tinted-lip-balm",
    category: "LIP CARE",
    price: 249.00,
    salePrice: 199.00,
    rating: 4.8,
    reviewsCount: 53,
    image: "/products/herbal-lip-balm/main.png",
    hoverImage: "/products/herbal-lip-balm/gallery-1.png",
    gallery: [
      "/products/herbal-lip-balm/main.png",
      "/products/herbal-lip-balm/gallery-1.png",
      "/products/herbal-lip-balm/gallery-2.png",
      "/products/herbal-lip-balm/gallery-3.png",
      "/products/herbal-lip-balm/gallery-4.png",
      "/products/herbal-lip-balm/gallery-5.png",
    ],
    description: "Ultra-comforting balm formulated with cold-pressed botanical oils, beeswax, and natural fruit pigments to relieve chapped lips and provide a healthy, soft berry tint.",
    note: "Chemical-free natural lip softness",
    inStock: true,
    stockQuantity: 150,
    badge: "Natural Tint",
    volume: "15 G",
    swatchCode: "1915 C",
  },
];

/**
 * Loads products from Supabase database `public.products` table.
 * Falls back to static seed products if unconfigured or database is unreachable.
 */
export async function fetchLiveProducts(category?: string): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    if (category && category.toUpperCase() !== "ALL") {
      return products.filter((p) => p.category.toUpperCase().includes(category.toUpperCase()));
    }
    return products;
  }

  try {
    let query = supabase.from("products").select("*").eq("is_active", true);
    if (category && category.toUpperCase() !== "ALL") {
      query = query.ilike("category", `%${category}%`);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (category && category.toUpperCase() !== "ALL") {
        return products.filter((p) => p.category.toUpperCase().includes(category.toUpperCase()));
      }
      return products;
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      price: Number(row.price),
      salePrice: row.sale_price ? Number(row.sale_price) : undefined,
      rating: row.rating ? Number(row.rating) : 5.0,
      reviewsCount: row.reviews_count || 0,
      image: row.image,
      hoverImage: row.hover_image || row.image,
      gallery: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery : [row.image],
      description: row.description,
      note: row.note,
      inStock: row.in_stock ?? (row.stock > 0),
      stockQuantity: row.stock ?? 50,
      badge: row.badge,
    }));
  } catch (err) {
    return products;
  }
}
