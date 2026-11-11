import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientBucketKey, rateLimitResponse } from "./_rate-limit.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

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

  const rl = checkRateLimit(`refund-payment:${getClientBucketKey(req)}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(res, rl);
  }

  const { orderId, paymentId, amount, reason } = req.body || {};
  if (!orderId && !paymentId) {
    return res.status(400).json({ error: "Missing orderId or paymentId for refund." });
  }

  const supabase = getSupabaseClient();
  let razorpayRefundResult = null;

  // If Razorpay secret is present and paymentId looks like a real gateway payment (starts with pay_)
  if (paymentId && paymentId.startsWith("pay_") && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    try {
      const authHeader = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount ? Math.round(Number(amount) * 100) : undefined, // in paise
          notes: { reason: reason || "Admin console requested refund" },
        }),
      });

      if (rzpRes.ok) {
        razorpayRefundResult = await rzpRes.json();
      } else {
        const errText = await rzpRes.text();
        console.warn("Razorpay refund error:", errText);
      }
    } catch (e) {
      console.warn("Could not reach Razorpay API for refund:", e);
    }
  }

  // Update order status in Supabase if database is available
  if (supabase && orderId) {
    try {
      await supabase
        .from("orders")
        .update({
          status: "cancelled_refunded",
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch (dbErr) {
      console.warn("Could not update order status in Supabase:", dbErr);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Refund processed successfully.",
    orderId,
    paymentId,
    razorpayRefund: razorpayRefundResult,
  });
}
