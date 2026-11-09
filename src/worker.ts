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
    try {
      const url = new URL(request.url);

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

    // 1. Admin product endpoint
    if (url.pathname === "/api/debug-env") {
      return jsonResponse({
        hasAssets: !!env.ASSETS,
        keys: Object.keys(env),
        host: url.host,
        hostname: url.hostname,
        url: request.url,
      });
    }

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

          let noteValue = body.note || "";
          if (body.seoTitle || body.seoDescription || body.seoKeywords || body.imageAlt || body.mrp) {
            let existingNoteObj: any = {};
            try {
              if (typeof noteValue === "string" && noteValue.trim().startsWith("{")) {
                existingNoteObj = JSON.parse(noteValue);
              }
            } catch (e) {}
            noteValue = JSON.stringify({
              ...existingNoteObj,
              seoTitle: body.seoTitle ?? existingNoteObj.seoTitle,
              seoDescription: body.seoDescription ?? existingNoteObj.seoDescription,
              seoKeywords: body.seoKeywords ?? existingNoteObj.seoKeywords,
              imageAlt: body.imageAlt ?? existingNoteObj.imageAlt,
              mrp: body.mrp ?? existingNoteObj.mrp,
            });
          }

          const dbRow = {
            id,
            name,
            slug,
            category: (body.category || "HEALTH CARE").toUpperCase(),
            description: body.description || "",
            note: noteValue,
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

    // 2. Image Upload endpoint (Supabase Storage)
    if (url.pathname === "/api/upload-image" && request.method === "POST") {
      try {
        const supabase = getSupabase(env);
        const contentTypeHeader = request.headers.get("content-type") || "";

        let fileBuffer: ArrayBuffer | Uint8Array;
        let fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        let mimeType = "image/jpeg";
        let bucket = "products";

        if (contentTypeHeader.includes("application/json")) {
          const body: any = await request.json();
          if (!body || !body.base64) {
            return jsonResponse({ error: "Missing 'base64' string in payload." }, 400);
          }
          bucket = body.bucket || "products";
          mimeType = body.contentType || "image/jpeg";
          if (body.filename) {
            const ext = body.filename.split(".").pop() || "jpg";
            fileName = `${body.filename.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.${ext}`;
          } else {
            const ext = mimeType.split("/")[1] || "jpg";
            fileName = `${fileName}.${ext}`;
          }

          const rawBase64 = body.base64.replace(/^data:[^;]+;base64,/, "");
          const binaryStr = atob(rawBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          fileBuffer = bytes;
        } else if (contentTypeHeader.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("file") as File;
          if (!file) {
            return jsonResponse({ error: "No file found in form data." }, 400);
          }
          bucket = (formData.get("bucket") as string) || "products";
          mimeType = file.type || "image/jpeg";
          const ext = file.name ? file.name.split(".").pop() : (mimeType.split("/")[1] || "jpg");
          fileName = `${fileName}.${ext}`;
          fileBuffer = await file.arrayBuffer();
        } else {
          return jsonResponse({ error: "Content-Type must be multipart/form-data or application/json" }, 400);
        }

        const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);

        return jsonResponse({
          success: true,
          url: pubData.publicUrl,
          path: data.path,
          bucket,
        }, 200);
      } catch (uploadErr: any) {
        return jsonResponse({ error: uploadErr?.message || "Upload failed." }, 500);
      }
    }

    // 3. Admin Store Settings endpoint
    if (url.pathname === "/api/admin-settings") {
      const supabase = getSupabase(env);
      if (request.method === "GET") {
        try {
          const { data, error } = await supabase.storage.from("images").download("site-settings.json");
          if (!error && data) {
            const text = await data.text();
            return jsonResponse(JSON.parse(text), 200);
          }
        } catch {}
        return jsonResponse({
          storeName: "JASS PRODUCTS",
          currency: "INR (₹)",
          gstin: "29AABCJ1984K1Z4",
          supportEmail: "apothecary@jassproducts.com",
          supportPhone: "070922 03886 / 97151 63119",
          address: "Dispensary 1: Near Noor Sait Primary School, Karumbukkadai | Dispensary 2: 13B Bright Avenue, Kuniyamuthur, Coimbatore, Tamil Nadu 641008"
        }, 200);
      }

      if (request.method === "POST") {
        try {
          const payload = await request.json();
          await supabase.storage.from("images").upload("site-settings.json", JSON.stringify(payload), {
            contentType: "application/json",
            upsert: true,
          });
          return jsonResponse({ success: true, settings: payload }, 200);
        } catch (err: any) {
          return jsonResponse({ error: err.message || "Failed to save settings." }, 500);
        }
      }
    }

    // 4. Admin Banners endpoint
    if (url.pathname === "/api/admin-banners") {
      const supabase = getSupabase(env);
      if (request.method === "GET") {
        try {
          const { data, error } = await supabase.storage.from("images").download("site-banners.json");
          if (!error && data) {
            const text = await data.text();
            return jsonResponse(JSON.parse(text), 200);
          }
        } catch {}
        return jsonResponse([], 200);
      }

      if (request.method === "POST") {
        try {
          const payload = await request.json();
          await supabase.storage.from("images").upload("site-banners.json", JSON.stringify(payload), {
            contentType: "application/json",
            upsert: true,
          });
          return jsonResponse({ success: true, banners: payload }, 200);
        } catch (err: any) {
          return jsonResponse({ error: err.message || "Failed to save banners." }, 500);
        }
      }
    }

    // 5. Admin Categories endpoint (persists live taxonomy)
    if (url.pathname === "/api/admin-categories") {
      const supabase = getSupabase(env);
      if (request.method === "GET") {
        try {
          const { data, error } = await supabase.storage.from("images").download("site-categories.json");
          if (!error && data) {
            const text = await data.text();
            return jsonResponse(JSON.parse(text), 200);
          }
        } catch {}

        // Fallback: derive dynamically from distinct categories in products table
        try {
          const { data: prods } = await supabase.from("products").select("category");
          const uniqueCats = Array.from(new Set((prods || []).map((p: any) => p.category).filter(Boolean)));
          const defaultCats = uniqueCats.map((name: string, i: number) => ({
            id: `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            description: `Apothecary ${name} collection`,
            image: "/products/amla-powder/main.webp",
            displayOrder: i + 1,
            status: "ACTIVE",
          }));
          return jsonResponse(defaultCats, 200);
        } catch {
          return jsonResponse([], 200);
        }
      }

      if (request.method === "POST") {
        try {
          const payload = await request.json();
          await supabase.storage.from("images").upload("site-categories.json", JSON.stringify(payload), {
            contentType: "application/json",
            upsert: true,
          });
          return jsonResponse({ success: true, categories: payload }, 200);
        } catch (err: any) {
          return jsonResponse({ error: err.message || "Failed to save categories." }, 500);
        }
      }
    }

    // 6. Admin Live Customers endpoint
    if (url.pathname === "/api/admin-customers" && request.method === "GET") {
      try {
        const supabase = getSupabase(env);
        const { data: profiles } = await supabase.from("profiles").select("*");
        const { data: orders } = await supabase.from("orders").select("customer_name, customer_email, phone, total_amount, created_at");

        const customerMap = new Map<string, any>();

        if (Array.isArray(profiles)) {
          profiles.forEach((p) => {
            if (p.email) {
              customerMap.set(p.email.toLowerCase(), {
                id: p.id,
                name: p.full_name || p.name || p.email.split("@")[0],
                email: p.email,
                phone: p.phone || "—",
                ordersCount: 0,
                totalSpent: 0,
                tier: p.role === "SUPER_ADMIN" ? "VIP" : "Standard",
                status: "ACTIVE",
                joinedDate: p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : "2026-09-01",
              });
            }
          });
        }

        if (Array.isArray(orders)) {
          orders.forEach((o) => {
            const email = (o.customer_email || "").toLowerCase();
            if (email) {
              const existing = customerMap.get(email) || {
                id: `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                name: o.customer_name || email.split("@")[0],
                email,
                phone: o.phone || "—",
                ordersCount: 0,
                totalSpent: 0,
                tier: "Standard",
                status: "ACTIVE",
                joinedDate: o.created_at ? new Date(o.created_at).toISOString().split("T")[0] : "2026-09-01",
              };
              existing.ordersCount += 1;
              existing.totalSpent += Number(o.total_amount || 0);
              if (existing.totalSpent > 1000) existing.tier = "VIP";
              customerMap.set(email, existing);
            }
          });
        }

        return jsonResponse(Array.from(customerMap.values()), 200);
      } catch (err: any) {
        return jsonResponse([], 200);
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
    try {
      if (env.ASSETS) {
        let assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status < 400 || assetResp.status === 304) {
          return assetResp;
        }
        const normUrl = new URL(url.pathname + url.search, "https://jassproducts.jass-products.workers.dev");
        assetResp = await env.ASSETS.fetch(new Request(normUrl.toString(), request));
        if (assetResp.status < 400 || assetResp.status === 304) {
          return assetResp;
        }
      }

      // External fetch fallback with clean headers
      const fallbackUrl = new URL(url.pathname + url.search, "https://jassproducts.jass-products.workers.dev");
      const fallbackHeaders = new Headers(request.headers);
      fallbackHeaders.delete("host");
      return await fetch(fallbackUrl.toString(), {
        method: request.method,
        headers: fallbackHeaders,
      });
    } catch (err: any) {
      console.warn("Primary asset fetch failed, attempting workers.dev fallback:", err);
      try {
        const fallbackUrl = new URL(url.pathname + url.search, "https://jassproducts.jass-products.workers.dev");
        return await fetch(fallbackUrl.toString());
      } catch (fallbackErr) {
        return new Response(`Asset fetch error: ${err?.message || String(err)}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
    } catch (topErr: any) {
      console.error("Top-level worker error:", topErr);
      return new Response(`Worker Exception: ${topErr?.message || String(topErr)}\nStack: ${topErr?.stack || ""}`, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
};
