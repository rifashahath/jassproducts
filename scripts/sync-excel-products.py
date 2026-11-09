import openpyxl, json, urllib.request, os

SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://duxjhmhgiacmuuqzfjxs.supabase.co')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Attempt to load from .env if not set in environment
if not SERVICE_KEY and os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                SERVICE_KEY = line.strip().split('=', 1)[1].strip()

if not SERVICE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required to sync catalog to Supabase.")
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
    'Herbal Soaps': 'Handcrafted Soap',
    'Herbal Powders': '100% Pure & Organic',
}

# Fetch existing DB products to preserve user uploaded images & galleries
existing_db = {}
try:
    req_existing = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/products?select=id,image,hover_image,gallery',
        headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
    )
    with urllib.request.urlopen(req_existing) as resp:
        for p in json.loads(resp.read().decode()):
            existing_db[p['id']] = p
except Exception as e:
    print('Notice: Could not pre-fetch existing products:', e)

# 2. Parse SEO Excel
wb_seo = openpyxl.load_workbook(SEO_EXCEL_PATH, data_only=True)
sheet_seo = wb_seo.active
rows_seo = list(sheet_seo.iter_rows(values_only=True))
headers = rows_seo[0]

db_rows = []
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

        fallback_imgs = slug_image_map.get(slug, ('/products/amla-powder/main.webp', '/products/amla-powder/main.webp'))
        badge = category_badge_map.get(cat, 'Ayurvedic')

        pid = f'jp-{num}'
        existing_item = existing_db.get(pid, {})
        current_img = existing_item.get('image') or fallback_imgs[0]
        current_hover = existing_item.get('hover_image') or fallback_imgs[1]
        
        # Merge gallery safely
        existing_gallery = existing_item.get('gallery') or []
        merged_gallery = list(existing_gallery) if isinstance(existing_gallery, list) and existing_gallery else [fallback_imgs[0], fallback_imgs[1]]
        if current_img not in merged_gallery:
            merged_gallery.insert(0, current_img)

        note_data = json.dumps({
            'seoTitle': seo_title,
            'seoDescription': meta_desc,
            'seoKeywords': keywords,
            'imageAlt': alt,
            'mrp': mrp,
            'volume': vol,
            'costPrice': cost,
            'gstRate': gst_rate
        })

        db_row = {
            'id': pid,
            'name': name,
            'slug': slug,
            'category': cat.upper(),
            'description': desc,
            'note': note_data,
            'price': offer,
            'sale_price': mrp,
            'image': current_img,
            'hover_image': current_hover,
            'gallery': merged_gallery,
            'badge': badge,
            'rating': 5.0,
            'reviews_count': 25 + (num * 3) % 40,
            'stock': 60,
            'in_stock': True,
            'is_featured': True,
            'is_active': True,
            'updated_at': '2026-11-09T18:00:00.000Z'
        }
        db_rows.append(db_row)

print(f'Syncing {len(db_rows)} updated products to Supabase...')

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

# Verify
req_verify = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/products?select=id,name,price,sale_price,category,note&order=id',
    headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
)
with urllib.request.urlopen(req_verify) as resp:
    data = json.loads(resp.read().decode())
    print(f'Total products verified in Supabase: {len(data)}')
    for item in data:
        n = json.loads(item['note']) if item.get('note') else {}
        print(f"  {item['id']}: {item['name']} ({item['category']}) - Offer: ₹{item['price']} | MRP: ₹{item['sale_price']} | Cost: ₹{n.get('costPrice')} | Vol: {n.get('volume')} | GST: {n.get('gstRate')}%")
