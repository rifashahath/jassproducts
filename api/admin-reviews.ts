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
  const rl = checkRateLimit(`admin-reviews:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  // GET: Fetch reviews
  if (req.method === "GET") {
    try {
      const productId = req.query.productId as string | undefined;
      const allStatus = req.query.all === "true";

      let query = supabase.from("product_reviews").select("*").order("created_at", { ascending: false });
      if (productId) {
        query = query.eq("product_id", productId);
      }
      if (!allStatus) {
        query = query.or("status.eq.published,status.eq.APPROVED");
      }

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const formatted = (data || []).map((r: any) => ({
        id: String(r.id),
        productId: r.product_id,
        productName: r.product_name || "Botanical Formulation",
        customerName: r.author || "Verified Customer",
        author: r.author || "Verified Customer",
        rating: Number(r.rating || 5),
        title: r.title || "",
        comment: r.comment || "",
        content: r.comment || "",
        verified: r.verified !== false,
        status: (r.status === "published" || r.status === "APPROVED" ? "APPROVED" : (r.status === "rejected" || r.status === "REJECTED" ? "REJECTED" : "PENDING")),
        helpfulCount: Number(r.helpful_count || 0),
        createdAt: r.created_at,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
      }));

      return res.status(200).json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch reviews" });
    }
  }

  // DELETE: Delete review
  if (req.method === "DELETE") {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Missing review id to delete." });
    }
    const { error } = await supabase.from("product_reviews").delete().eq("id", String(id));
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, deletedId: id });
  }

  // POST / PUT: Create or update review
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ error: "Empty review payload." });
      }

      // If updating status of an existing review
      if (body.id && body.status) {
        const dbStatus = body.status === "APPROVED" ? "published" : (body.status === "REJECTED" ? "rejected" : "pending");
        const { data, error } = await supabase
          .from("product_reviews")
          .update({ status: dbStatus })
          .eq("id", body.id)
          .select();

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ success: true, review: data?.[0] });
      }

      // Customer submitting a new review
      const author = String(body.author || body.customerName || "Customer").trim();
      const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
      const comment = String(body.comment || body.content || "").trim();
      const productId = String(body.productId || "jp-1");

      if (!comment) {
        return res.status(400).json({ error: "Review text comment is required." });
      }

      const row = {
        product_id: productId,
        author,
        rating,
        title: body.title || "",
        comment,
        verified: body.verified !== false,
        status: body.status === "APPROVED" ? "published" : "pending", // default to pending for moderation
      };

      const { data, error } = await supabase.from("product_reviews").insert(row).select();
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, review: data?.[0] || row });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to process review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed. Use GET, POST, or DELETE." });
}
