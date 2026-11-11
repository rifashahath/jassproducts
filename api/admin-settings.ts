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
  const rl = checkRateLimit(`admin-settings:${getClientBucketKey(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase service client not configured." });
  }

  // GET: Fetch all store settings
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase.from("store_settings").select("*");
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const map: Record<string, any> = {};
      (data || []).forEach((row: any) => {
        map[row.key] = row.value;
      });

      // If general_settings exists, spread it at top level for backward compatibility
      const responsePayload = {
        ...map,
        ...(map.general_settings || {}),
      };

      return res.status(200).json(responsePayload);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch settings" });
    }
  }

  // POST / PUT: Save setting(s)
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ error: "Empty settings payload." });
      }

      let key = "general_settings";
      let value = body;

      // If body is in format { key: "...", value: ... }
      if (body.key && body.value !== undefined) {
        key = body.key;
        value = body.value;
      }

      const { data, error } = await supabase.from("store_settings").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      }).select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, key, value });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to save settings" });
    }
  }

  return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}
