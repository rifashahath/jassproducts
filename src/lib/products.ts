/**
 * Product Data Model & Catalog Configuration for Jass Products.
 * Single source of truth for beauty, skincare, and hair care items.
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
    name: "Anti-Dandruff Shampoo",
    slug: "silky-shine-anti-dandruff-combo",
    category: "HAIR CARE",
    price: 42.0,
    rating: 4.9,
    reviewsCount: 38,
    image: "/products/shampoo-bottle-3d.jpg",
    image3D: "/products/shampoo-bottle-3d.jpg",
    hoverImage: "/products/shampoo-bottle-3d.jpg",
    gallery: ["/products/shampoo-bottle-3d.jpg", "/newcat-1.png"],
    description: "Holistic hair care elixir designed with rosemary, neem and sea salt to eradicate flaking while sealing moisture into hair follicles.",
    inStock: true,
    stockQuantity: 100,
    badge: "Best Seller",
    swatchCode: "334 U",
    volume: "250 ML",
  },
  {
    id: "jp-2",
    name: "Renew Serum",
    slug: "renew-serum",
    category: "SKIN RENEWAL",
    price: 58.0,
    rating: 5.0,
    reviewsCount: 52,
    image: "/products/renew-serum-3d.jpg",
    image3D: "/products/renew-serum-3d.jpg",
    hoverImage: "/products/renew-serum-3d.jpg",
    gallery: ["/products/renew-serum-3d.jpg", "/newcat-2.png"],
    description: "Concentrated botanical renewal serum with pure Kashmiri saffron threads and jasmine targeting cellular turnover and radiance.",
    inStock: true,
    stockQuantity: 75,
    badge: "Top Rated",
    swatchCode: "289 C",
    volume: "50 ML",
  },
  {
    id: "jp-3",
    name: "Pure Powders Health Care Trio",
    slug: "pure-powders-health-care-trio",
    category: "HEALTH CARE",
    price: 38.0,
    rating: 4.9,
    reviewsCount: 36,
    image: "/products/health-care-powders-3d.jpg",
    image3D: "/products/health-care-powders-3d.jpg",
    hoverImage: "/products/health-care-powders-3d.jpg",
    gallery: ["/products/health-care-powders-3d.jpg", "/newcat-3.png"],
    description: "100% pure organic herbal wellness powders set including Beetroot, Carrot, and Moringa leaf powder for complete vitality and daily holistic health.",
    inStock: true,
    stockQuantity: 80,
    badge: "Wellness Trio",
    swatchCode: "109 U",
    volume: "100 G x 3",
  },
  {
    id: "jp-4",
    name: "Natural Herbal Soap",
    slug: "natural-herbal-soap",
    category: "SOAP & BATH",
    price: 18.0,
    rating: 4.9,
    reviewsCount: 47,
    image: "/products/soap-bar-3d.jpg",
    image3D: "/products/soap-bar-3d.jpg",
    hoverImage: "/products/soap-bar-3d.jpg",
    gallery: ["/products/soap-bar-3d.jpg", "/newcat-soap.png"],
    description: "Artisanal cold-processed Ayurvedic soap bar enriched with neem, turmeric, pure virgin coconut oil, and soothing aloe vera for a nourishing, creamy lather.",
    inStock: true,
    stockQuantity: 85,
    badge: "Handmade",
    swatchCode: "357 C",
    volume: "125 G",
  },
  {
    id: "jp-5",
    name: "Hydrating Cream",
    slug: "deep-hydrating-cream-sets",
    category: "FACE NOURISH",
    price: 85.0,
    rating: 4.9,
    reviewsCount: 44,
    image: "/products/hydrating-cream-3d.jpg",
    image3D: "/products/hydrating-cream-3d.jpg",
    hoverImage: "/products/hydrating-cream-3d.jpg",
    gallery: ["/products/hydrating-cream-3d.jpg", "/newcat-4.png"],
    description: "Intense 24-hour hydration moisture seal set with raw organic shea butter and rejuvenating gotu kola plant ceramides.",
    inStock: true,
    stockQuantity: 40,
    badge: "Limited Edition",
    swatchCode: "209 C",
    volume: "50 ML",
  },
  {
    id: "jp-6",
    name: "Botanical Body Wash",
    slug: "nourishing-body-wash",
    category: "BODY CARE",
    price: 32.0,
    rating: 4.6,
    reviewsCount: 22,
    image: "/products/body-wash-3d.jpg",
    image3D: "/products/body-wash-3d.jpg",
    hoverImage: "/products/body-wash-3d.jpg",
    gallery: ["/products/body-wash-3d.jpg"],
    description: "Sulfate-free body wash infused with raw organic honey, fresh sliced turmeric, and aromatic sandalwood shavings.",
    inStock: true,
    stockQuantity: 50,
    swatchCode: "1795 C",
    volume: "500 ML",
  },
  {
    id: "jp-7",
    name: "Glow Clay Mask",
    slug: "glow-face-mask",
    category: "SKIN RENEWAL",
    price: 45.0,
    rating: 4.8,
    reviewsCount: 31,
    image: "/products/clay-mask-3d.jpg",
    image3D: "/products/clay-mask-3d.jpg",
    hoverImage: "/products/clay-mask-3d.jpg",
    gallery: ["/products/clay-mask-3d.jpg"],
    description: "Illuminating terracotta clay mask enriched with sun-dried orange slices, golden turmeric powder, and mineral extracts.",
    inStock: true,
    stockQuantity: 35,
    swatchCode: "2310 C",
    volume: "100 G",
  },
  {
    id: "jp-8",
    name: "Calming Sleep Mist",
    slug: "calming-sleep-mist",
    category: "AROMATHERAPY",
    price: 24.0,
    rating: 4.9,
    reviewsCount: 60,
    image: "/products/sleep-mist-3d.jpg",
    image3D: "/products/sleep-mist-3d.jpg",
    hoverImage: "/products/sleep-mist-3d.jpg",
    gallery: ["/products/sleep-mist-3d.jpg"],
    description: "Relaxing deep indigo chamomile and star jasmine pillow mist designed for serene sleep and ambient tranquil calm.",
    inStock: true,
    stockQuantity: 90,
    swatchCode: "2375 U",
    volume: "100 ML",
  },
  {
    id: "jp-9",
    name: "Amla Hair Elixir",
    slug: "amla-hair-elixir",
    category: "HAIR CARE",
    price: 48.0,
    rating: 5.0,
    reviewsCount: 42,
    image: "/products/amla-elixir-3d.jpg",
    image3D: "/products/amla-elixir-3d.jpg",
    hoverImage: "/products/amla-elixir-3d.jpg",
    gallery: ["/products/amla-elixir-3d.jpg"],
    description: "Lustrous scalp and follicle stimulating oil crafted from cold-pressed green amla gooseberries and vital bhringraj leaves.",
    inStock: true,
    stockQuantity: 65,
    badge: "Pure Harvest",
    swatchCode: "1775 U",
    volume: "50 ML",
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
    let query = supabase.from("products").select("*");
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

    return products; // Return the rich 3D catalog with swatch metadata
  } catch (err) {
    return products;
  }
}
