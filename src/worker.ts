import { createClient } from "@supabase/supabase-js";
import { calculateOrderPricing, parsePositiveQuantity } from "./lib/pricing-calculator.ts";
import { products as staticProducts, getProductSlug } from "./lib/products.ts";

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const DEFAULT_SUPABASE_URL = "https://duxjhmhgiacmuuqzfjxs.supabase.co";
const DEFAULT_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGpobWhnaWFjbXV1cXpmanhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NTA4NywiZXhwIjoyMTA0MTcxMDg3fQ._X4hT06eNEhvFWA7y7TmFH23dZX1Tw-1QSW3znsPBeo";

function getSupabase(env: Env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. Admin product endpoint
    if (url.pathname === "/api/admin-product") {
      const supabase = getSupabase(env);

      if (request.method === "GET") {
        const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }
        return jsonResponse(data, 200);
      }

      if (request.method === "POST") {
        try {
          const body: any = await request.json();
          if (!body || !body.name) {
            return jsonResponse({ error: "Product payload requires at least a name." }, 400);
          }

          const id = String(body.id || `jp-${Date.now().toString(36)}`);
          const name = String(body.name).trim();
          const slug = body.slug || name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
          const price = Number(body.price) || 0;
          const salePrice = body.salePrice !== undefined ? Number(body.salePrice) : (body.sale_price !== undefined ? Number(body.sale_price) : undefined);
          const stock = body.stockQuantity !== undefined ? Number(body.stockQuantity) : (body.stock !== undefined ? Number(body.stock) : 50);

          const dbRow = {
            id,
            name,
            slug,
            category: (body.category || "HEALTH CARE").toUpperCase(),
            description: body.description || "",
            note: body.note || "",
            price,
            sale_price: salePrice ?? null,
            stock,
            in_stock: body.inStock ?? (stock > 0),
            badge: body.badge || "",
            image: body.image || "/products/amla-powder/main.webp",
            hover_image: body.hoverImage || body.hover_image || body.image || "/products/amla-powder/main.webp",
            gallery: Array.isArray(body.gallery) && body.gallery.length > 0 ? body.gallery : [body.image || "/products/amla-powder/main.webp"],
            rating: body.rating ? Number(body.rating) : 5.0,
            reviews_count: body.reviewsCount || body.reviews_count || 0,
            is_active: body.status !== "ARCHIVED" && body.is_active !== false,
            updated_at: new Date().toISOString(),
          };

          const { data, error } = await supabase.from("products").upsert(dbRow).select();
          if (error) {
            return jsonResponse({ error: error.message }, 500);
          }

          return jsonResponse({ success: true, product: data?.[0] || dbRow }, 200);
        } catch (err: any) {
          return jsonResponse({ error: err.message || "Failed to parse JSON" }, 500);
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) {
          return jsonResponse({ error: "Missing product id" }, 400);
        }

        const { error } = await supabase.from("products").delete().eq("id", String(id));
        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ success: true, deletedId: id }, 200);
      }
    }

    // 2. Revalidate cart endpoint
    if (url.pathname === "/api/revalidate-cart" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const { items, couponCode } = body || {};

        if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
          return jsonResponse({ error: "Invalid request. 'items' must contain between 1 and 100 products." }, 400);
        }

        const supabase = getSupabase(env);
        const productIds = items.map((i: any) => String(i.id));
        let dbProducts: any[] = [];

        try {
          const { data } = await supabase
            .from("products")
            .select("id, name, price, stock, image, category, slug")
            .in("id", productIds);
          if (Array.isArray(data)) {
            dbProducts = data;
          }
        } catch (e) {
          console.warn("Product catalogue lookup in worker revalidate threw:", e);
        }

        const productMap = new Map<string, any>();
        dbProducts.forEach((p) => {
          productMap.set(p.id, p);
          if (p.slug) productMap.set(p.slug, p);
        });

        const validatedItems = [];
        const warnings: string[] = [];
        let hasStockIssue = false;

        for (const item of items) {
          const itemIdStr = String(item.id);
          let dbProd = productMap.get(itemIdStr);

          if (!dbProd) {
            const staticP = staticProducts.find(
              (p) =>
                p.id === itemIdStr ||
                p.slug === itemIdStr ||
                getProductSlug(p) === itemIdStr
            );
            if (staticP) {
              dbProd = {
                id: staticP.id,
                name: staticP.name,
                price: staticP.price,
                stock: staticP.stockQuantity ?? (staticP.inStock ? 50 : 0),
                image: staticP.image,
              };
            }
          }

          if (!dbProd) {
            warnings.push(`Item '${item.name || item.id}' is no longer available in store.`);
            continue;
          }

          const clientPrice = Number(item.clientPrice);
          const serverPrice = Number(dbProd.price);
          if (clientPrice && clientPrice !== serverPrice) {
            warnings.push(`Price for '${dbProd.name}' changed to ₹${serverPrice.toLocaleString("en-IN")}.`);
          }

          const qty = parsePositiveQuantity(item.qty) ?? 0;
          if (qty === 0) {
            warnings.push(`Invalid quantity for '${dbProd.name}'.`);
            hasStockIssue = true;
            continue;
          }

          const availableStock = Number(dbProd.stock ?? 50);
          const isAvailable = availableStock >= qty;
          if (!isAvailable) {
            hasStockIssue = true;
            warnings.push(`Only ${availableStock} units available for '${dbProd.name}'.`);
          }

          validatedItems.push({
            id: dbProd.id,
            name: dbProd.name,
            price: serverPrice,
            qty,
            image: dbProd.image,
            stockQuantity: availableStock,
            isAvailable,
          });
        }

        let couponData = null;
        if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
          try {
            const { data } = await supabase
              .from("coupons")
              .select("*")
              .eq("code", couponCode.trim().toUpperCase())
              .eq("status", "ACTIVE")
              .maybeSingle();
            if (data) couponData = data;
          } catch (e) {
            console.warn("Coupon lookup error:", e);
          }
        }

        const pricing = calculateOrderPricing(validatedItems, {
          coupon: couponData
            ? {
                code: couponData.code,
                discountType: couponData.discount_type,
                discountValue: Number(couponData.discount_value),
                maxDiscountCap: couponData.max_discount_cap ? Number(couponData.max_discount_cap) : null,
                minOrderAmount: couponData.min_order_amount ? Number(couponData.min_order_amount) : null,
                expiryDate: couponData.expiry_date,
                status: couponData.status,
              }
            : null,
        });

        return jsonResponse({
          valid: !hasStockIssue,
          subtotal: pricing.subtotal,
          discountAmount: pricing.discountAmount,
          discountPercent: couponData?.discount_type === "PERCENTAGE" ? Number(couponData.discount_value) : 0,
          shippingFee: pricing.shippingFee,
          gstAmount: pricing.gstAmount,
          total: pricing.finalTotal,
          items: validatedItems,
          warnings,
        }, 200);
      } catch (err: any) {
        return jsonResponse({ error: "Unable to validate cart pricing." }, 500);
      }
    }

    // Default: Serve frontend static assets from ./dist
    return env.ASSETS.fetch(request);
  },
};
