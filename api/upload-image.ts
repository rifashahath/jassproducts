import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientBucketKey, rateLimitResponse } from "./_rate-limit.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://duxjhmhgiacmuuqzfjxs.supabase.co";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const rl = checkRateLimit(`upload-image:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  try {
    const body = req.body || {};
    if (!body.base64) {
      return res.status(400).json({ error: "Missing 'base64' string in payload." });
    }

    const bucket = body.bucket || "products";
    const contentType = body.contentType || "image/jpeg";
    const rawBase64 = body.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(rawBase64, "base64");

    let fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (body.filename) {
      const ext = body.filename.split(".").pop() || "jpg";
      fileName = `${body.filename.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.${ext}`;
    } else {
      const ext = contentType.split("/")[1] || "jpg";
      fileName = `${fileName}.${ext}`;
    }

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return res.status(200).json({
      success: true,
      url: pubData.publicUrl,
      path: data.path,
      bucket,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to upload image." });
  }
}
