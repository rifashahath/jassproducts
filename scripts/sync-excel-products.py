import openpyxl, json, urllib.request, os

SUPABASE_URL = 'https://duxjhmhgiacmuuqzfjxs.supabase.co'
SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGpobWhnaWFjbXV1cXpmanhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NTA4NywiZXhwIjoyMTA0MTcxMDg3fQ._X4hT06eNEhvFWA7y7TmFH23dZX1Tw-1QSW3znsPBeo'
EXCEL_PATH = '/home/intellact/Downloads/Jass_Products_Descriptions_SEO.xlsx'

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
    'Herbal Soaps': 'Handcrafted Soap',
    'Herbal Powders': '100% Pure & Organic',
}

volume_map = {
    'beetroot-lip-balm': '15 G',
    'strawberry-lip-balm': '15 G',
    'saffron-gel': '100 G',
    'tan-removal-cream': '50 G',
    'night-moisturiser': '50 G',
    'kumkumadi-cream': '50 G',
    'vitamin-c-cream': '50 G',
    'goat-milk-face-wash': '150 ML',
    'sunscreen-lotion-spf-50': '100 ML',
    'pigmentation-serum': '30 ML',
    'anti-aging-cream': '50 G',
    'silky-shine-shampoo': '200 ML',
    'anti-dandruff-shampoo': '200 ML',
    'hair-oil': '100 ML',
    'multani-mitti-soap': '100 G',
    'aloe-vera-soap': '100 G',
    'kuppaimeni-soap': '100 G',
    'beetroot-soap': '100 G',
    'goat-milk-soap': '100 G',
    'moringa-leaf-powder': '100 G',
    'beetroot-powder': '100 G',
    'amla-powder': '100 G',
    'carrot-powder': '100 G',
}

wb = openpyxl.load_workbook(EXCEL_PATH)
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))
headers = rows[0]

products_list = []
db_rows = []

for r in rows[1:]:
    if any(r):
        num = int(r[headers.index('No')])
        name = str(r[headers.index('Product Name')]).strip()
        cat = str(r[headers.index('Category')]).strip()
        offer = float(r[headers.index('Offer Price (₹)')])
        mrp = float(r[headers.index('MRP (₹)')])
        desc = str(r[headers.index('Product Description')]).strip()
        seo_title = str(r[headers.index('SEO Title')]).strip()
        meta_desc = str(r[headers.index('Meta Description')]).strip()
        slug = str(r[headers.index('URL Slug')]).strip()
        keywords = str(r[headers.index('Keywords')]).strip()
        alt = str(r[headers.index('Image Alt Text')]).strip()

        imgs = slug_image_map.get(slug, ('/products/amla-powder/main.webp', '/products/amla-powder/main.webp'))
        vol = volume_map.get(slug, '100 G')
        badge = category_badge_map.get(cat, 'Ayurvedic')

        note_data = json.dumps({
            'seoTitle': seo_title,
            'seoDescription': meta_desc,
            'seoKeywords': keywords,
            'imageAlt': alt,
            'mrp': mrp,
            'volume': vol
        })

        db_row = {
            'id': f'jp-{num}',
            'name': name,
            'slug': slug,
            'category': cat.upper(),
            'description': desc,
            'note': note_data,
            'price': offer,
            'sale_price': mrp,
            'image': imgs[0],
            'hover_image': imgs[1],
            'gallery': [imgs[0], imgs[1]],
            'badge': badge,
            'rating': 5.0,
            'reviews_count': 25 + (num * 3) % 40,
            'stock': 60,
            'in_stock': True,
            'is_featured': True,
            'is_active': True,
            'updated_at': '2026-11-09T12:00:00.000Z'
        }
        db_rows.append(db_row)

print(f'Syncing {len(db_rows)} products to Supabase...')

# 1. Upsert all rows into Supabase products table
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/products',
    data=json.dumps(db_rows).encode(),
    headers={
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    },
    method='POST'
)

with urllib.request.urlopen(req) as resp:
    print('Supabase products upsert status:', resp.status)

# 2. Check total products now in Supabase
req_verify = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/products?select=id,name,price,sale_price,category&order=id',
    headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
)
with urllib.request.urlopen(req_verify) as resp:
    data = json.loads(resp.read().decode())
    print(f'Total products in Supabase: {len(data)}')
    for item in data:
        print(f"  {item['id']}: {item['name']} ({item['category']}) - Offer: ₹{item['price']} | MRP: ₹{item['sale_price']}")

