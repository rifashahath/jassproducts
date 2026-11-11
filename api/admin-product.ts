import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientBucketKey, rateLimitResponse } from "./_rate-limit.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Could not create Supabase client:", err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rl = checkRateLimit(`admin-product:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  if (req.method === "DELETE") {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Missing product id to delete." });
    }
    const { error } = await supabase.from("products").delete().eq("id", String(id));
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, deletedId: id });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body;
    if (!body || !body.name) {
      return res.status(400).json({ error: "Product payload requires at least a name." });
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
      is_active: (body.status === "PUBLISHED" || (!body.status && body.is_active !== false)) && body.status !== "DRAFT" && body.status !== "ARCHIVED" && body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("products").upsert(dbRow).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, product: data?.[0] || dbRow });
  }

  return res.status(405).json({ error: "Method not allowed. Use POST, PUT, or DELETE." });
}
