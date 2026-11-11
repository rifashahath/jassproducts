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
  const rl = checkRateLimit(`admin-categories:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  // GET: Fetch categories
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const formatted = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || c.banner_image || "/products/herbal-shampoo/main.webp",
        displayOrder: Number(c.display_order || 0),
        status: (c.status?.toUpperCase() || "ACTIVE") as "ACTIVE" | "INACTIVE",
        productCount: Number(c.products_count || 0),
      }));

      return res.status(200).json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch categories" });
    }
  }

  // DELETE: Remove category
  if (req.method === "DELETE") {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Missing category id to delete." });
    }
    const { error } = await supabase.from("categories").delete().eq("id", String(id));
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, deletedId: id });
  }

  // POST / PUT: Upsert category
  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body;
    if (!body || !body.name) {
      return res.status(400).json({ error: "Category payload requires at least a name." });
    }

    const id = String(body.id || `cat-${Date.now().toString(36)}`);
    const name = String(body.name).trim();
    const slug = body.slug || name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");

    const row = {
      id,
      name,
      slug,
      description: body.description || "",
      image: body.image || "/products/herbal-shampoo/main.webp",
      banner_image: body.bannerImage || body.image || "/products/herbal-shampoo/main.webp",
      display_order: Number(body.displayOrder ?? body.display_order ?? 0),
      status: (body.status || "ACTIVE").toUpperCase(),
      products_count: Number(body.productCount ?? body.products_count ?? 0),
    };

    const { data, error } = await supabase.from("categories").upsert(row).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, category: data?.[0] || row });
  }

  return res.status(405).json({ error: "Method not allowed. Use GET, POST, or DELETE." });
}
