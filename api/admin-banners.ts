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
  const rl = checkRateLimit(`admin-banners:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  // GET: Fetch all active or all banners
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Format to HeroBannerRecord structure
      const formatted = (data || []).map((b: any) => ({
        id: b.id,
        title: b.title || "",
        subtitle: b.subtitle || "",
        imageUrl: b.image || b.imageUrl || "",
        ctaText: b.cta_text || b.ctaText || "Shop Now",
        ctaLink: b.link || b.ctaLink || "/shop",
        active: b.status === "ACTIVE" || b.active === true,
        displayOrder: Number(b.display_order ?? b.displayOrder ?? 0),
        startDate: b.start_date || b.startDate || "",
        endDate: b.end_date || b.endDate || "",
        location: b.badge || b.location || "Hero Carousel",
      }));

      return res.status(200).json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch banners" });
    }
  }

  // DELETE: Remove banner by ID
  if (req.method === "DELETE") {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Missing banner id to delete." });
    }
    const { error } = await supabase.from("banners").delete().eq("id", String(id));
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, deletedId: id });
  }

  // POST / PUT: Upsert single or array of banners
  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: "Empty banner payload." });
    }

    const bannerItems = Array.isArray(body) ? body : [body];
    const rows = bannerItems.map((b: any, index: number) => ({
      id: String(b.id || `ban-${Date.now().toString(36)}-${index}`),
      title: b.title || "Ayurvedic Regimen",
      subtitle: b.subtitle || "",
      badge: b.location || b.badge || "Hero Carousel",
      image: b.imageUrl || b.image || "/image.webp",
      link: b.ctaLink || b.link || "/shop",
      cta_text: b.ctaText || b.cta_text || "Shop Now",
      display_order: Number(b.displayOrder ?? b.display_order ?? index),
      status: b.active === false || b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    }));

    const { data, error } = await supabase.from("banners").upsert(rows).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, banners: data });
  }

  return res.status(405).json({ error: "Method not allowed. Use GET, POST, or DELETE." });
}
