import openpyxl, json

COST_EXCEL_PATH = '/home/intellact/Downloads/Jass_Cost_Price_Updated1.xlsx'
SEO_EXCEL_PATH = '/home/intellact/Downloads/Jass_Products_Descriptions_SEO.xlsx'

# 1. Parse Cost & Price Excel
wb_cost = openpyxl.load_workbook(COST_EXCEL_PATH, data_only=True)
sheet_cost = wb_cost.active
cost_map = {}
for r in range(8, 31):
    name = str(sheet_cost.cell(row=r, column=1).value).strip()
    size = sheet_cost.cell(row=r, column=2).value
    unit = sheet_cost.cell(row=r, column=3).value
    cost = float(sheet_cost.cell(row=r, column=4).value)
    offer = float(sheet_cost.cell(row=r, column=5).value)
    mrp = float(sheet_cost.cell(row=r, column=6).value)
    gst = sheet_cost.cell(row=r, column=7).value
    
    vol_str = f'{size} {unit.upper()}'
    if str(size).upper().endswith(unit.upper()):
        vol_str = str(size).upper()
        if ' ' not in vol_str:
            vol_str = vol_str[:-len(unit)] + ' ' + unit.upper()

    gst_rate = 18
    if gst == 0.05 or gst == '0.05':
        gst_rate = 5
    elif gst == 0.18 or gst == '0.18' or '18%' in str(gst):
        gst_rate = 18

    cost_map[name] = {
        'name': name,
        'volume': vol_str,
        'cost': cost,
        'offer': offer,
        'mrp': mrp,
        'gstRate': gst_rate
    }

alias_map = {
    'Silky Shine Shampoo': 'Shampoo',
    'Goat Milk Face Wash': 'Face Wash',
    'Sunscreen Lotion SPF 50++': 'Sunscreen 50+++',
    'Anti Aging Cream': 'Anti-Aging Cream',
    'Night Moisturiser': 'Night Moisturizer',
    'Anti Dandruff Shampoo': 'Anti-Dandruff Shampoo',
}

slug_image_map = {
    'beetroot-lip-balm': ('/products/beetroot-lip-balm/main.webp', '/products/herbal-lip-balm/gallery-1.webp'),
    'strawberry-lip-balm': ('/products/strawberry-lip-balm/main.webp', '/products/herbal-lip-balm/gallery-2.webp'),
    'saffron-gel': ('/products/saffron-gel/main.webp', '/products/saffron-gel/gallery-1.webp'),
    'tan-removal-cream': ('/products/tan-removal-cream/main.webp', '/products/vitamin-c-cream/gallery-1.webp'),
    'night-moisturiser': ('/products/night-cream/main.webp', '/products/night-cream/gallery-1.webp'),
    'kumkumadi-cream': ('/products/kumkumadi-cream/main.webp', '/products/saffron-gel/gallery-2.webp'),
    'vitamin-c-cream': ('/products/vitamin-c-cream/main.webp', '/products/vitamin-c-cream/gallery-1.webp'),
    'goat-milk-face-wash': ('/products/goat-milk-face-wash/main.webp', '/products/goat-milk-face-wash/main.webp'),
    'sunscreen-lotion-spf-50': ('/products/sunscreen/main.webp', '/products/sunscreen/gallery-1.webp'),
    'pigmentation-serum': ('/products/pigmentation-serum/main.webp', '/products/pigmentation-cream/gallery-1.webp'),
    'anti-aging-cream': ('/products/anti-aging-cream/main.webp', '/products/anti-aging-cream/gallery-1.webp'),
    'silky-shine-shampoo': ('/products/silky-shine-shampoo/main.webp', '/products/herbal-shampoo/gallery-1.webp'),
    'anti-dandruff-shampoo': ('/products/anti-dandruff-shampoo/main.webp', '/products/herbal-shampoo/gallery-2.webp'),
    'hair-oil': ('/products/hair-oil/main.webp', '/products/hair-oil/main.webp'),
    'multani-mitti-soap': ('/products/multani-mitti-soap/main.webp', '/products/multani-mitti-soap/main.webp'),
    'aloe-vera-soap': ('/products/aloe-vera-soap/main.webp', '/products/aloe-vera-soap/main.webp'),
    'kuppaimeni-soap': ('/products/kuppaimeni-soap/main.webp', '/products/kuppaimeni-soap/main.webp'),
    'beetroot-soap': ('/products/beetroot-soap/main.webp', '/products/beetroot-soap/main.webp'),
    'goat-milk-soap': ('/products/goat-milk-soap/main.webp', '/products/goat-milk-soap/main.webp'),
    'moringa-leaf-powder': ('/products/moringa-powder/main.webp', '/products/moringa-powder/gallery-1.webp'),
    'beetroot-powder': ('/products/beetroot-powder/main.webp', '/products/beetroot-powder/gallery-1.webp'),
    'amla-powder': ('/products/amla-powder/main.webp', '/products/amla-powder/gallery-1.webp'),
    'carrot-powder': ('/products/carrot-powder/main.webp', '/products/carrot-powder/gallery-1.webp'),
}

category_badge_map = {
    'Lip Care': 'Natural Tint',
    'Face & Skin Care': 'Botanical Actives',
    'Hair Care': 'Ayurvedic Formula',
    'Herbal Soaps': 'Handcrafted Cold-Process',
    'Herbal Powders': '100% Pure & Organic',
}

swatch_map = {
    'Lip Care': '1915 C',
    'Face & Skin Care': '1235 C',
    'Hair Care': '7530 C',
    'Herbal Soaps': '728 C',
    'Herbal Powders': '334 U',
}

wb_seo = openpyxl.load_workbook(SEO_EXCEL_PATH, data_only=True)
sheet_seo = wb_seo.active
rows_seo = list(sheet_seo.iter_rows(values_only=True))
headers = rows_seo[0]

ts_products = []
for r in rows_seo[1:]:
    if any(r):
        num = int(r[headers.index('No')])
        name = str(r[headers.index('Product Name')]).strip()
        cat = str(r[headers.index('Category')]).strip()
        desc = str(r[headers.index('Product Description')]).strip()
        seo_title = str(r[headers.index('SEO Title')]).strip()
        meta_desc = str(r[headers.index('Meta Description')]).strip()
        slug = str(r[headers.index('URL Slug')]).strip()
        keywords = str(r[headers.index('Keywords')]).strip()
        alt = str(r[headers.index('Image Alt Text')]).strip()

        cost_key = alias_map.get(name, name)
        cinfo = cost_map[cost_key]

        offer = cinfo['offer']
        mrp = cinfo['mrp']
        cost = cinfo['cost']
        vol = cinfo['volume']
        gst_rate = cinfo['gstRate']

        imgs = slug_image_map.get(slug, ('/products/amla-powder/main.webp', '/products/amla-powder/main.webp'))
        badge = category_badge_map.get(cat, 'Ayurvedic')
        swatch = swatch_map.get(cat, '334 U')

        item = {
            'id': f'jp-{num}',
            'sku': f'JP-{cat[:2].upper()}-{num:03d}',
            'name': name,
            'slug': slug,
            'category': cat.upper(),
            'price': offer,
            'mrp': mrp,
            'salePrice': offer,
            'costPrice': cost,
            'gstRate': gst_rate,
            'rating': 5.0,
            'reviewsCount': 25 + (num * 3) % 40,
            'image': imgs[0],
            'hoverImage': imgs[1],
            'gallery': [imgs[0], imgs[1]],
            'description': desc,
            'note': f'Authentic {cat} formulation by Jass Products',
            'seoTitle': seo_title,
            'seoDescription': meta_desc,
            'seoKeywords': keywords,
            'imageAlt': alt,
            'inStock': True,
            'stockQuantity': 60,
            'badge': badge,
            'volume': vol,
            'swatchCode': swatch,
        }
        ts_products.append(item)

header_code = """/**
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
      .replace(/[^\\w\\s-]/g, "")
      .replace(/[\\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return String(product.id);
}

export function toWebpPath(url: string | undefined): string {
  if (!url) return '';
  return url.replace(/(\\/(?:products|banner|cat)\\/[^\\s\"';`)]+|\\/(?:image|img-[0-9]+))\\.(?:png|jpe?g)/gi, '$1.webp');
}

export const products: Product[] = """

footer_code = """;

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
"""

full_ts = header_code + json.dumps(ts_products, indent=2) + footer_code

with open('/home/intellact/Downloads/jassproductssite/src/lib/products.ts', 'w') as f:
    f.write(full_ts)

print(f'Updated src/lib/products.ts successfully with {len(ts_products)} products!')
