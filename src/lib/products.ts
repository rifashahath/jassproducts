/**
 * Product Data Model & Catalog Configuration for Jass Products.
 * Single source of truth for beauty, skincare, health, and hair care items.
 * Sourced directly from Jass_Cost_Price_Updated1.xlsx & Jass_Products_Descriptions_SEO.xlsx catalog.
 */

import { supabase, isSupabaseConfigured } from "./supabase.ts";

export type Product = {
  id: string | number;
  sku?: string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  mrp?: number;
  salePrice?: number;
  costPrice?: number;
  gstRate?: number;
  rating?: number;
  reviewsCount?: number;
  image: string;
  image3D?: string;
  hoverImage?: string;
  gallery?: string[];
  note?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  imageAlt?: string;
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

export function toWebpPath(url: string | undefined): string {
  if (!url) return '';
  return url.replace(/(\/(?:products|banner|cat)\/[^\s"';`)]+|\/(?:image|img-[0-9]+))\.(?:png|jpe?g)/gi, '$1.webp');
}

export const products: Product[] = [
  {
    "id": "jp-1",
    "sku": "JP-LI-001",
    "name": "Beetroot Lip Balm",
    "slug": "beetroot-lip-balm",
    "category": "LIP CARE",
    "price": 99.0,
    "mrp": 149.0,
    "salePrice": 99.0,
    "costPrice": 58.4,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 28,
    "image": "/products/beetroot-lip-balm/main.webp",
    "hoverImage": "/products/herbal-lip-balm/gallery-1.webp",
    "gallery": [
      "/products/beetroot-lip-balm/main.webp",
      "/products/herbal-lip-balm/gallery-1.webp"
    ],
    "description": "Jass Beetroot Lip Balm is a natural lip care balm made with beetroot to help soften dry, rough lips and leave a light pink tint. It glides on smoothly, feels comfortable all day and is easy to carry in a pocket or bag. Apply whenever your lips feel dry, and before bed for soft lips by morning.",
    "note": "Authentic Lip Care formulation by Jass Products",
    "seoTitle": "Beetroot Lip Balm \u2013 Natural Lip Care | Jass Products",
    "seoDescription": "Buy Beetroot Lip Balm online: natural lip balm for soft, lightly tinted lips. Offer price \u20b999 (MRP \u20b9149). Order on WhatsApp.",
    "seoKeywords": "beetroot lip balm, natural lip balm, pink lip balm, tinted lip balm, lip care, dry lips",
    "imageAlt": "Jass Products Beetroot Lip Balm",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Natural Tint",
    "volume": "10 G",
    "swatchCode": "1915 C"
  },
  {
    "id": "jp-2",
    "sku": "JP-LI-002",
    "name": "Strawberry Lip Balm",
    "slug": "strawberry-lip-balm",
    "category": "LIP CARE",
    "price": 99.0,
    "mrp": 149.0,
    "salePrice": 99.0,
    "costPrice": 59.2,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 31,
    "image": "/products/strawberry-lip-balm/main.webp",
    "hoverImage": "/products/herbal-lip-balm/gallery-2.webp",
    "gallery": [
      "/products/strawberry-lip-balm/main.webp",
      "/products/herbal-lip-balm/gallery-2.webp"
    ],
    "description": "Jass Strawberry Lip Balm gives dry, chapped lips gentle care with a sweet strawberry touch. Its smooth texture melts on application and leaves lips feeling soft and moisturised. A small, handy pack for daily use at home, at work or while travelling.",
    "note": "Authentic Lip Care formulation by Jass Products",
    "seoTitle": "Strawberry Lip Balm \u2013 Natural Lip Care | Jass Products",
    "seoDescription": "Buy Strawberry Lip Balm online: natural lip balm with a sweet strawberry touch. Offer price \u20b999 (MRP \u20b9149). Order on WhatsApp.",
    "seoKeywords": "strawberry lip balm, natural lip balm, moisturising lip balm, lip care, chapped lips",
    "imageAlt": "Jass Products Strawberry Lip Balm",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Natural Tint",
    "volume": "10 G",
    "swatchCode": "1915 C"
  },
  {
    "id": "jp-3",
    "sku": "JP-FA-003",
    "name": "Saffron Gel",
    "slug": "saffron-gel",
    "category": "FACE & SKIN CARE",
    "price": 125.0,
    "mrp": 200.0,
    "salePrice": 125.0,
    "costPrice": 42.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 34,
    "image": "/products/saffron-gel/main.webp",
    "hoverImage": "/products/saffron-gel/gallery-1.webp",
    "gallery": [
      "/products/saffron-gel/main.webp",
      "/products/saffron-gel/gallery-1.webp"
    ],
    "description": "Jass Saffron Gel is a light, non-sticky face gel made with saffron to help skin look fresh, bright and glowing. It spreads easily, absorbs quickly and suits daily use. Apply a thin layer on a clean face and neck, morning or night, and massage gently until absorbed.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Saffron Gel for Glowing Skin | Jass Products",
    "seoDescription": "Buy Saffron Gel online: light face gel with saffron for a fresh, glowing look. Offer price \u20b9125 (MRP \u20b9200). Order on WhatsApp.",
    "seoKeywords": "saffron gel, kesar gel, face gel for glow, glowing skin, natural face gel",
    "imageAlt": "Jass Products Saffron Gel",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-4",
    "sku": "JP-FA-004",
    "name": "Tan Removal Cream",
    "slug": "tan-removal-cream",
    "category": "FACE & SKIN CARE",
    "price": 125.0,
    "mrp": 200.0,
    "salePrice": 125.0,
    "costPrice": 48.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 37,
    "image": "/products/tan-removal-cream/main.webp",
    "hoverImage": "/products/vitamin-c-cream/gallery-1.webp",
    "gallery": [
      "/products/tan-removal-cream/main.webp",
      "/products/vitamin-c-cream/gallery-1.webp"
    ],
    "description": "Jass Tan Removal Cream is made to help reduce the look of sun tan and uneven skin tone on the face and neck. Its soft cream texture spreads smoothly and feels comfortable on the skin. Use regularly after coming in from the sun for a fresher, clearer-looking complexion.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Tan Removal Cream \u2013 Natural Skin Care | Jass Products",
    "seoDescription": "Buy Tan Removal Cream online: cream that helps reduce the look of sun tan. Offer price \u20b9125 (MRP \u20b9200). Order on WhatsApp.",
    "seoKeywords": "tan removal cream, de tan cream, sun tan cream, skin brightening cream, natural skin care",
    "imageAlt": "Jass Products Tan Removal Cream",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-5",
    "sku": "JP-FA-005",
    "name": "Night Moisturiser",
    "slug": "night-moisturiser",
    "category": "FACE & SKIN CARE",
    "price": 165.0,
    "mrp": 250.0,
    "salePrice": 165.0,
    "costPrice": 42.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 40,
    "image": "/products/night-cream/main.webp",
    "hoverImage": "/products/night-cream/gallery-1.webp",
    "gallery": [
      "/products/night-cream/main.webp",
      "/products/night-cream/gallery-1.webp"
    ],
    "description": "Jass Night Moisturiser is a rich yet comfortable cream to use at the end of the day. It helps keep skin soft, smooth and well moisturised while you sleep, so your face looks fresh in the morning. Apply a small amount on a clean face and neck before bed.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Night Moisturiser for Face \u2013 Natural | Jass Products",
    "seoDescription": "Buy Night Moisturiser online: night cream that keeps skin soft and moisturised. Offer price \u20b9165 (MRP \u20b9250). Order on WhatsApp.",
    "seoKeywords": "night moisturiser, night cream, face moisturiser, overnight skin care, natural night cream",
    "imageAlt": "Jass Products Night Moisturiser",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-6",
    "sku": "JP-FA-006",
    "name": "Kumkumadi Cream",
    "slug": "kumkumadi-cream",
    "category": "FACE & SKIN CARE",
    "price": 155.0,
    "mrp": 220.0,
    "salePrice": 155.0,
    "costPrice": 48.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 43,
    "image": "/products/kumkumadi-cream/main.webp",
    "hoverImage": "/products/saffron-gel/gallery-2.webp",
    "gallery": [
      "/products/kumkumadi-cream/main.webp",
      "/products/saffron-gel/gallery-2.webp"
    ],
    "description": "Jass Kumkumadi Cream is inspired by the traditional Kumkumadi formula used in Indian skin care. It helps skin look bright, even and naturally glowing. The cream is soft, easy to apply and absorbs well. Use daily on clean skin, morning or night.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Kumkumadi Cream for Glowing Skin | Jass Products",
    "seoDescription": "Buy Kumkumadi Cream online: Kumkumadi-inspired cream for a bright, glowing look. Offer price \u20b9155 (MRP \u20b9220). Order on WhatsApp.",
    "seoKeywords": "kumkumadi cream, kumkumadi face cream, ayurvedic face cream, glow cream, natural skin care",
    "imageAlt": "Jass Products Kumkumadi Cream",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-7",
    "sku": "JP-FA-007",
    "name": "Vitamin C Cream",
    "slug": "vitamin-c-cream",
    "category": "FACE & SKIN CARE",
    "price": 175.0,
    "mrp": 250.0,
    "salePrice": 175.0,
    "costPrice": 40.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 46,
    "image": "/products/vitamin-c-cream/main.webp",
    "hoverImage": "/products/vitamin-c-cream/gallery-1.webp",
    "gallery": [
      "/products/vitamin-c-cream/main.webp",
      "/products/vitamin-c-cream/gallery-1.webp"
    ],
    "description": "Jass Vitamin C Cream is a daily face cream that helps skin look fresh, bright and radiant. The smooth texture spreads evenly and leaves skin feeling soft and moisturised. Apply on a clean face and neck every day, and follow with sunscreen in the morning.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Vitamin C Face Cream \u2013 Natural Glow | Jass Products",
    "seoDescription": "Buy Vitamin C Cream online: Vitamin C face cream for fresh, radiant-looking skin. Offer price \u20b9175 (MRP \u20b9250). Order on WhatsApp.",
    "seoKeywords": "vitamin c cream, vitamin c face cream, brightening cream, glow cream, natural face cream",
    "imageAlt": "Jass Products Vitamin C Cream",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-8",
    "sku": "JP-FA-008",
    "name": "Goat Milk Face Wash",
    "slug": "goat-milk-face-wash",
    "category": "FACE & SKIN CARE",
    "price": 195.0,
    "mrp": 350.0,
    "salePrice": 195.0,
    "costPrice": 66.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 49,
    "image": "/products/goat-milk-face-wash/main.webp",
    "hoverImage": "/products/goat-milk-face-wash/main.webp",
    "gallery": [
      "/products/goat-milk-face-wash/main.webp",
      "/products/goat-milk-face-wash/main.webp"
    ],
    "description": "Jass Goat Milk Face Wash gently cleans dirt and oil from your face while helping skin stay soft and fresh. The creamy goat milk formula is mild and easy to use every day. Wet your face, massage a small amount in circles, then rinse well with water.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Goat Milk Face Wash \u2013 Gentle Cleanser | Jass Products",
    "seoDescription": "Buy Goat Milk Face Wash online: gentle face wash that cleans and keeps skin soft. Offer price \u20b9195 (MRP \u20b9350). Order on WhatsApp.",
    "seoKeywords": "goat milk face wash, gentle face wash, natural face wash, daily face cleanser, soft skin",
    "imageAlt": "Jass Products Goat Milk Face Wash",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "100 ML",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-9",
    "sku": "JP-FA-009",
    "name": "Sunscreen Lotion SPF 50++",
    "slug": "sunscreen-lotion-spf-50",
    "category": "FACE & SKIN CARE",
    "price": 225.0,
    "mrp": 350.0,
    "salePrice": 225.0,
    "costPrice": 106.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 52,
    "image": "/products/sunscreen/main.webp",
    "hoverImage": "/products/sunscreen/gallery-1.webp",
    "gallery": [
      "/products/sunscreen/main.webp",
      "/products/sunscreen/gallery-1.webp"
    ],
    "description": "Jass Sunscreen Lotion SPF 50++ helps protect your skin from the sun's UV rays during daily outdoor use. The lotion is light, spreads easily and does not feel heavy. Apply generously on the face, neck and other exposed skin 15 minutes before going out, and reapply every few hours.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Sunscreen Lotion SPF 50++ | Jass Products",
    "seoDescription": "Buy Sunscreen Lotion SPF 50++ online: SPF 50++ sunscreen lotion for daily sun protection. Offer price \u20b9225 (MRP \u20b9350). Order on WhatsApp.",
    "seoKeywords": "sunscreen lotion, SPF 50 sunscreen, sunscreen for face, sun protection, natural sunscreen",
    "imageAlt": "Jass Products Sunscreen Lotion SPF 50++",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-10",
    "sku": "JP-FA-010",
    "name": "Pigmentation Serum",
    "slug": "pigmentation-serum",
    "category": "FACE & SKIN CARE",
    "price": 299.0,
    "mrp": 350.0,
    "salePrice": 299.0,
    "costPrice": 101.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 55,
    "image": "/products/pigmentation-serum/main.webp",
    "hoverImage": "/products/pigmentation-cream/gallery-1.webp",
    "gallery": [
      "/products/pigmentation-serum/main.webp",
      "/products/pigmentation-cream/gallery-1.webp"
    ],
    "description": "Jass Pigmentation Serum is a light serum that helps improve the look of dark spots and uneven skin tone. It absorbs quickly and does not leave a sticky feel. Apply a few drops on clean skin once or twice a day, and use sunscreen in the daytime for best results.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Pigmentation Serum for Even Skin Tone | Jass Products",
    "seoDescription": "Buy Pigmentation Serum online: serum that helps even out the look of dark spots. Offer price \u20b9299 (MRP \u20b9350). Order on WhatsApp.",
    "seoKeywords": "pigmentation serum, dark spot serum, face serum, even skin tone, natural serum",
    "imageAlt": "Jass Products Pigmentation Serum",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "30 ML",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-11",
    "sku": "JP-FA-011",
    "name": "Anti Aging Cream",
    "slug": "anti-aging-cream",
    "category": "FACE & SKIN CARE",
    "price": 330.0,
    "mrp": 400.0,
    "salePrice": 330.0,
    "costPrice": 128.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 58,
    "image": "/products/anti-aging-cream/main.webp",
    "hoverImage": "/products/anti-aging-cream/gallery-1.webp",
    "gallery": [
      "/products/anti-aging-cream/main.webp",
      "/products/anti-aging-cream/gallery-1.webp"
    ],
    "description": "Jass Anti Aging Cream helps reduce the look of fine lines and keeps skin soft, smooth and firm-looking. It is a rich cream that absorbs well and is comfortable for regular use. Massage gently upwards on a clean face and neck every night for fresher, younger-looking skin.",
    "note": "Authentic Face & Skin Care formulation by Jass Products",
    "seoTitle": "Anti Aging Cream for Face \u2013 Natural | Jass Products",
    "seoDescription": "Buy Anti Aging Cream online: cream that helps reduce the look of fine lines. Offer price \u20b9330 (MRP \u20b9400). Order on WhatsApp.",
    "seoKeywords": "anti aging cream, anti ageing cream, wrinkle cream, fine lines cream, natural face cream",
    "imageAlt": "Jass Products Anti Aging Cream",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Botanical Actives",
    "volume": "40 G",
    "swatchCode": "1235 C"
  },
  {
    "id": "jp-12",
    "sku": "JP-HA-012",
    "name": "Silky Shine Shampoo",
    "slug": "silky-shine-shampoo",
    "category": "HAIR CARE",
    "price": 295.0,
    "mrp": 400.0,
    "salePrice": 295.0,
    "costPrice": 119.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 61,
    "image": "/products/silky-shine-shampoo/main.webp",
    "hoverImage": "/products/herbal-shampoo/gallery-1.webp",
    "gallery": [
      "/products/silky-shine-shampoo/main.webp",
      "/products/herbal-shampoo/gallery-1.webp"
    ],
    "description": "Jass Silky Shine Shampoo cleans your hair and scalp gently and helps leave hair soft, smooth and shiny. It lathers well and rinses out easily. Apply on wet hair, massage the scalp, then rinse thoroughly. Use regularly for healthy-looking, silky hair.",
    "note": "Authentic Hair Care formulation by Jass Products",
    "seoTitle": "Silky Shine Shampoo \u2013 Natural Hair Care | Jass Products",
    "seoDescription": "Buy Silky Shine Shampoo online: natural shampoo for soft, smooth, shiny hair. Offer price \u20b9295 (MRP \u20b9400). Order on WhatsApp.",
    "seoKeywords": "silky shine shampoo, natural shampoo, herbal shampoo, shiny hair shampoo, hair care",
    "imageAlt": "Jass Products Silky Shine Shampoo",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Ayurvedic Formula",
    "volume": "200 ML",
    "swatchCode": "7530 C"
  },
  {
    "id": "jp-13",
    "sku": "JP-HA-013",
    "name": "Anti Dandruff Shampoo",
    "slug": "anti-dandruff-shampoo",
    "category": "HAIR CARE",
    "price": 295.0,
    "mrp": 400.0,
    "salePrice": 295.0,
    "costPrice": 119.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 64,
    "image": "/products/anti-dandruff-shampoo/main.webp",
    "hoverImage": "/products/herbal-shampoo/gallery-2.webp",
    "gallery": [
      "/products/anti-dandruff-shampoo/main.webp",
      "/products/herbal-shampoo/gallery-2.webp"
    ],
    "description": "Jass Anti Dandruff Shampoo is made to help reduce the look of dandruff flakes and keep your scalp clean and fresh. It cleans gently and rinses out easily. Massage into the wet scalp, leave for a minute or two, then rinse well. Use regularly for a comfortable, flake-free look.",
    "note": "Authentic Hair Care formulation by Jass Products",
    "seoTitle": "Anti Dandruff Shampoo \u2013 Natural | Jass Products",
    "seoDescription": "Buy Anti Dandruff Shampoo online: shampoo that helps reduce dandruff flakes and keeps scalp clean. Offer price \u20b9295 (MRP \u20b9400). Order on WhatsApp.",
    "seoKeywords": "anti dandruff shampoo, dandruff shampoo, herbal shampoo, scalp care, natural shampoo",
    "imageAlt": "Jass Products Anti Dandruff Shampoo",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Ayurvedic Formula",
    "volume": "200 ML",
    "swatchCode": "7530 C"
  },
  {
    "id": "jp-14",
    "sku": "JP-HA-014",
    "name": "Hair Oil",
    "slug": "hair-oil",
    "category": "HAIR CARE",
    "price": 200.0,
    "mrp": 250.0,
    "salePrice": 200.0,
    "costPrice": 90.0,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 27,
    "image": "/products/hair-oil/main.webp",
    "hoverImage": "/products/hair-oil/main.webp",
    "gallery": [
      "/products/hair-oil/main.webp",
      "/products/hair-oil/main.webp"
    ],
    "description": "Jass Hair Oil is a natural hair oil to nourish your scalp and hair. Regular oiling helps keep hair soft, smooth and healthy-looking. Warm a little oil, massage it into the scalp and along the hair, and leave for at least an hour or overnight before washing.",
    "note": "Authentic Hair Care formulation by Jass Products",
    "seoTitle": "Natural Hair Oil for Healthy Hair | Jass Products",
    "seoDescription": "Buy Hair Oil online: natural hair oil for healthy, nourished-looking hair. Offer price \u20b9200 (MRP \u20b9250). Order on WhatsApp.",
    "seoKeywords": "hair oil, natural hair oil, herbal hair oil, hair nourishment, scalp massage oil",
    "imageAlt": "Jass Products Hair Oil",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Ayurvedic Formula",
    "volume": "70 ML",
    "swatchCode": "7530 C"
  },
  {
    "id": "jp-15",
    "sku": "JP-HE-015",
    "name": "Multani Mitti Soap",
    "slug": "multani-mitti-soap",
    "category": "HERBAL SOAPS",
    "price": 99.0,
    "mrp": 150.0,
    "salePrice": 99.0,
    "costPrice": 55.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 30,
    "image": "/products/multani-mitti-soap/main.webp",
    "hoverImage": "/products/multani-mitti-soap/main.webp",
    "gallery": [
      "/products/multani-mitti-soap/main.webp",
      "/products/multani-mitti-soap/main.webp"
    ],
    "description": "Jass Multani Mitti Soap is a handcrafted herbal soap made with multani mitti (fuller's earth). It cleans away dirt and excess oil and leaves skin feeling fresh and smooth. A good everyday soap, especially for oily skin.",
    "note": "Authentic Herbal Soaps formulation by Jass Products",
    "seoTitle": "Multani Mitti Soap \u2013 Herbal Handmade | Jass Products",
    "seoDescription": "Buy Multani Mitti Soap online: handcrafted herbal soap for fresh, clean skin. Offer price \u20b985 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "multani mitti soap, fuller's earth soap, herbal soap, handmade soap, oily skin soap",
    "imageAlt": "Jass Products Multani Mitti Soap",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Handcrafted Cold-Process",
    "volume": "100 G",
    "swatchCode": "728 C"
  },
  {
    "id": "jp-16",
    "sku": "JP-HE-016",
    "name": "Aloe Vera Soap",
    "slug": "aloe-vera-soap",
    "category": "HERBAL SOAPS",
    "price": 99.0,
    "mrp": 150.0,
    "salePrice": 99.0,
    "costPrice": 55.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 33,
    "image": "/products/aloe-vera-soap/main.webp",
    "hoverImage": "/products/aloe-vera-soap/main.webp",
    "gallery": [
      "/products/aloe-vera-soap/main.webp",
      "/products/aloe-vera-soap/main.webp"
    ],
    "description": "Jass Aloe Vera Soap is a handcrafted herbal soap made with aloe vera. It cleans gently and leaves skin feeling soft, cool and fresh. Mild enough for daily bathing for the whole family.",
    "note": "Authentic Herbal Soaps formulation by Jass Products",
    "seoTitle": "Aloe Vera Soap \u2013 Herbal Handmade | Jass Products",
    "seoDescription": "Buy Aloe Vera Soap online: handcrafted herbal soap that leaves skin soft and fresh. Offer price \u20b985 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "aloe vera soap, herbal soap, handmade soap, natural bath soap, soft skin soap",
    "imageAlt": "Jass Products Aloe Vera Soap",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Handcrafted Cold-Process",
    "volume": "100 G",
    "swatchCode": "728 C"
  },
  {
    "id": "jp-17",
    "sku": "JP-HE-017",
    "name": "Kuppaimeni Soap",
    "slug": "kuppaimeni-soap",
    "category": "HERBAL SOAPS",
    "price": 99.0,
    "mrp": 150.0,
    "salePrice": 99.0,
    "costPrice": 55.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 36,
    "image": "/products/kuppaimeni-soap/main.webp",
    "hoverImage": "/products/kuppaimeni-soap/main.webp",
    "gallery": [
      "/products/kuppaimeni-soap/main.webp",
      "/products/kuppaimeni-soap/main.webp"
    ],
    "description": "Jass Kuppaimeni Soap is a handcrafted herbal soap made with kuppaimeni (Indian acalypha), a plant long used in traditional South Indian care. It cleans the skin gently and leaves it feeling fresh. A natural choice for daily bathing.",
    "note": "Authentic Herbal Soaps formulation by Jass Products",
    "seoTitle": "Kuppaimeni Soap \u2013 Herbal Handmade | Jass Products",
    "seoDescription": "Buy Kuppaimeni Soap online: traditional handcrafted herbal soap made with kuppaimeni. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "kuppaimeni soap, kuppaimeni herbal soap, traditional herbal soap, handmade soap, natural bath soap",
    "imageAlt": "Jass Products Kuppaimeni Soap",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Handcrafted Cold-Process",
    "volume": "100 G",
    "swatchCode": "728 C"
  },
  {
    "id": "jp-18",
    "sku": "JP-HE-018",
    "name": "Beetroot Soap",
    "slug": "beetroot-soap",
    "category": "HERBAL SOAPS",
    "price": 99.0,
    "mrp": 150.0,
    "salePrice": 99.0,
    "costPrice": 55.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 39,
    "image": "/products/beetroot-soap/main.webp",
    "hoverImage": "/products/beetroot-soap/main.webp",
    "gallery": [
      "/products/beetroot-soap/main.webp",
      "/products/beetroot-soap/main.webp"
    ],
    "description": "Jass Beetroot Soap is a handcrafted herbal soap made with beetroot. It cleans gently and leaves skin feeling soft, fresh and smooth. Its natural pink colour comes from beetroot. A pleasant everyday bath soap.",
    "note": "Authentic Herbal Soaps formulation by Jass Products",
    "seoTitle": "Beetroot Soap \u2013 Herbal Handmade | Jass Products",
    "seoDescription": "Buy Beetroot Soap online: handcrafted herbal soap for fresh, soft skin. Offer price \u20b985 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "beetroot soap, herbal soap, handmade soap, natural bath soap, soft skin soap",
    "imageAlt": "Jass Products Beetroot Soap",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Handcrafted Cold-Process",
    "volume": "100 G",
    "swatchCode": "728 C"
  },
  {
    "id": "jp-19",
    "sku": "JP-HE-019",
    "name": "Goat Milk Soap",
    "slug": "goat-milk-soap",
    "category": "HERBAL SOAPS",
    "price": 99.0,
    "mrp": 150.0,
    "salePrice": 99.0,
    "costPrice": 55.5,
    "gstRate": 18,
    "rating": 5.0,
    "reviewsCount": 42,
    "image": "/products/goat-milk-soap/main.webp",
    "hoverImage": "/products/goat-milk-soap/main.webp",
    "gallery": [
      "/products/goat-milk-soap/main.webp",
      "/products/goat-milk-soap/main.webp"
    ],
    "description": "Jass Goat Milk Soap is a handcrafted soap with a creamy lather. It cleans gently and helps leave skin feeling soft, smooth and moisturised. A mild, comforting soap for daily bathing, especially for dry skin.",
    "note": "Authentic Herbal Soaps formulation by Jass Products",
    "seoTitle": "Goat Milk Soap \u2013 Herbal Handmade | Jass Products",
    "seoDescription": "Buy Goat Milk Soap online: creamy handcrafted soap for soft, smooth skin. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "goat milk soap, handmade goat milk soap, moisturising soap, dry skin soap, herbal soap",
    "imageAlt": "Jass Products Goat Milk Soap",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "Handcrafted Cold-Process",
    "volume": "100 G",
    "swatchCode": "728 C"
  },
  {
    "id": "jp-20",
    "sku": "JP-HE-020",
    "name": "Moringa Leaf Powder",
    "slug": "moringa-leaf-powder",
    "category": "HERBAL POWDERS",
    "price": 100.0,
    "mrp": 150.0,
    "salePrice": 100.0,
    "costPrice": 55.5,
    "gstRate": 5,
    "rating": 5.0,
    "reviewsCount": 45,
    "image": "/products/moringa-powder/main.webp",
    "hoverImage": "/products/moringa-powder/gallery-1.webp",
    "gallery": [
      "/products/moringa-powder/main.webp",
      "/products/moringa-powder/gallery-1.webp"
    ],
    "description": "Jass Moringa Leaf Powder is a natural herbal powder made from dried moringa (drumstick) leaves. Moringa is a traditional part of Indian home wellness. Please follow the directions on the pack for how to use it. Store in a cool, dry place in a tightly closed pack.",
    "note": "Authentic Herbal Powders formulation by Jass Products",
    "seoTitle": "Moringa Leaf Powder \u2013 Natural Herbal | Jass Products",
    "seoDescription": "Buy Moringa Leaf Powder online: natural moringa (drumstick) leaf powder. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "moringa leaf powder, moringa powder, murungai keerai powder, drumstick leaf powder, herbal powder",
    "imageAlt": "Jass Products Moringa Leaf Powder",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "100% Pure & Organic",
    "volume": "100 G",
    "swatchCode": "334 U"
  },
  {
    "id": "jp-21",
    "sku": "JP-HE-021",
    "name": "Beetroot Powder",
    "slug": "beetroot-powder",
    "category": "HERBAL POWDERS",
    "price": 100.0,
    "mrp": 150.0,
    "salePrice": 100.0,
    "costPrice": 55.5,
    "gstRate": 5,
    "rating": 5.0,
    "reviewsCount": 48,
    "image": "/products/beetroot-powder/main.webp",
    "hoverImage": "/products/beetroot-powder/gallery-1.webp",
    "gallery": [
      "/products/beetroot-powder/main.webp",
      "/products/beetroot-powder/gallery-1.webp"
    ],
    "description": "Jass Beetroot Powder is a natural powder made from dried beetroot, with a deep red colour. Please follow the directions on the pack for how to use it. Store in a cool, dry place in a tightly closed pack to keep it fresh.",
    "note": "Authentic Herbal Powders formulation by Jass Products",
    "seoTitle": "Beetroot Powder \u2013 Natural Herbal | Jass Products",
    "seoDescription": "Buy Beetroot Powder online: natural beetroot powder. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "beetroot powder, natural beetroot powder, herbal powder, dried beetroot powder",
    "imageAlt": "Jass Products Beetroot Powder",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "100% Pure & Organic",
    "volume": "100 G",
    "swatchCode": "334 U"
  },
  {
    "id": "jp-22",
    "sku": "JP-HE-022",
    "name": "Amla Powder",
    "slug": "amla-powder",
    "category": "HERBAL POWDERS",
    "price": 100.0,
    "mrp": 150.0,
    "salePrice": 100.0,
    "costPrice": 55.5,
    "gstRate": 5,
    "rating": 5.0,
    "reviewsCount": 51,
    "image": "/products/amla-powder/main.webp",
    "hoverImage": "/products/amla-powder/gallery-1.webp",
    "gallery": [
      "/products/amla-powder/main.webp",
      "/products/amla-powder/gallery-1.webp"
    ],
    "description": "Jass Amla Powder is a natural herbal powder made from dried amla (Indian gooseberry), a well-known ingredient in traditional Indian homes. Please follow the directions on the pack for how to use it. Store in a cool, dry place in a tightly closed pack.",
    "note": "Authentic Herbal Powders formulation by Jass Products",
    "seoTitle": "Amla Powder \u2013 Natural Herbal | Jass Products",
    "seoDescription": "Buy Amla Powder online: natural amla (Indian gooseberry) powder. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "amla powder, amla powder for hair, Indian gooseberry powder, nellikai powder, herbal powder",
    "imageAlt": "Jass Products Amla Powder",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "100% Pure & Organic",
    "volume": "100 G",
    "swatchCode": "334 U"
  },
  {
    "id": "jp-23",
    "sku": "JP-HE-023",
    "name": "Carrot Powder",
    "slug": "carrot-powder",
    "category": "HERBAL POWDERS",
    "price": 100.0,
    "mrp": 150.0,
    "salePrice": 100.0,
    "costPrice": 55.5,
    "gstRate": 5,
    "rating": 5.0,
    "reviewsCount": 54,
    "image": "/products/carrot-powder/main.webp",
    "hoverImage": "/products/carrot-powder/gallery-1.webp",
    "gallery": [
      "/products/carrot-powder/main.webp",
      "/products/carrot-powder/gallery-1.webp"
    ],
    "description": "Jass Carrot Powder is a natural powder made from dried carrots, with a bright orange colour. Please follow the directions on the pack for how to use it. Store in a cool, dry place in a tightly closed pack to keep it fresh.",
    "note": "Authentic Herbal Powders formulation by Jass Products",
    "seoTitle": "Carrot Powder \u2013 Natural Herbal | Jass Products",
    "seoDescription": "Buy Carrot Powder online: natural carrot powder. Offer price \u20b9100 (MRP \u20b9150). Order on WhatsApp.",
    "seoKeywords": "carrot powder, natural carrot powder, herbal powder, dried carrot powder",
    "imageAlt": "Jass Products Carrot Powder",
    "inStock": true,
    "stockQuantity": 60,
    "badge": "100% Pure & Organic",
    "volume": "100 G",
    "swatchCode": "334 U"
  }
];

/**
 * Loads products from Supabase database `public.products` table.
 * Falls back to static catalog if unconfigured or database is unreachable.
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

    return data.map((row: any) => {
      let extra: any = {};
      try {
        if (row.note && typeof row.note === 'string' && row.note.trim().startsWith('{')) {
          extra = JSON.parse(row.note);
        }
      } catch (e) {}

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        price: Number(row.price),
        mrp: extra.mrp || (row.sale_price ? Number(row.sale_price) : undefined),
        salePrice: row.sale_price ? Number(row.sale_price) : undefined,
        costPrice: extra.costPrice,
        gstRate: extra.gstRate,
        rating: row.rating ? Number(row.rating) : 5.0,
        reviewsCount: row.reviews_count || 0,
        image: toWebpPath(row.image),
        hoverImage: toWebpPath(row.hover_image || row.image),
        gallery: Array.isArray(row.gallery) && row.gallery.length > 0
          ? row.gallery.map((g: string) => toWebpPath(g))
          : [toWebpPath(row.image)],
        description: row.description,
        note: extra.note || row.note,
        seoTitle: extra.seoTitle,
        seoDescription: extra.seoDescription,
        seoKeywords: extra.seoKeywords,
        imageAlt: extra.imageAlt,
        volume: extra.volume,
        inStock: row.in_stock ?? (row.stock > 0),
        stockQuantity: row.stock ?? 50,
        badge: row.badge,
      };
    });
  } catch (err) {
    return products;
  }
}
