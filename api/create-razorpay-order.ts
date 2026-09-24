import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import { checkRateLimit, getClientBucketKey, rateLimitResponse } from "./_rate-limit.ts";
import { calculateOrderPricing } from "../src/lib/pricing-calculator.ts";
import { parsePositiveQuantity } from "../src/lib/pricing-calculator.ts";
import { products as staticProducts, getProductSlug } from "../src/lib/products.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const RAZORPAY_KEY_ID =
  process.env.VITE_RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  "";

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_SECRET ||
  "";

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

  // Rate limit before any gateway or database work. Payment/order creation is
  // the most expensive unauthenticated path in the app (a paid-gateway API
  // call per success), so it gets the tightest budget.
  const rl = checkRateLimit(`create-order:${getClientBucketKey(req)}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    console.warn("Rate limit hit on create-razorpay-order, retry after", rl.retryAfterSeconds, "s");
    return rateLimitResponse(res, rl);
  }

  // Fail-closed: refuse to proceed without gateway credentials. Without this check a
  // missing secret reaches the Razorpay call, fails, and is swallowed by the error
  // path below, which fabricates a synthetic order id instead of surfacing the fault.
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error(
      "Order creation rejected: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured on the server."
    );
    return res.status(500).json({
      error: "Payment gateway configuration error. Please contact store support.",
    });
  }

  try {
    const { items, couponCode, userEmail, userPhone } = req.body || {};

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ error: "Invalid request. 'items' must contain between 1 and 100 products." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Order creation rejected: Supabase is not configured with a server-side service-role key.");
      return res.status(503).json({
        error: "Checkout is temporarily unavailable. Please contact the store before attempting payment.",
      });
    }

    // 1. Fetch authoritative product data from catalog
    const productIds = items.map((i: any) => String(i.id));
    let dbProducts: any[] = [];

    // A failed catalogue read must not be silently indistinguishable from "this product
    // does not exist" — the two need different responses, because one is the customer's
    // fault and the other is ours. Tracked rather than thrown so a cart whose items all
    // resolve from the static seed still completes during a database blip.
    let catalogueLookupFailed = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, price, stock, image, category, slug")
          .in("id", productIds);
        if (error) {
          console.error("Product catalogue lookup failed:", error);
          catalogueLookupFailed = true;
        } else if (Array.isArray(data)) {
          dbProducts = data;
        }
      } catch (e) {
        console.error("Product catalogue lookup threw:", e);
        catalogueLookupFailed = true;
      }
    }

    const productMap = new Map<string, any>();
    dbProducts.forEach((p) => {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    });

    // 2. Validate stock availability and construct validated item lines
    const validatedItems = [];

    for (const item of items) {
      const itemIdStr = String(item.id);
      let dbProd = productMap.get(itemIdStr);

      if (!dbProd) {
        const staticP = staticProducts.find(
          (p) =>
            p.id === itemIdStr ||
            p.slug === itemIdStr ||
            getProductSlug(p) === itemIdStr ||
            p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === itemIdStr.toLowerCase()
        );
        if (staticP) {
          dbProd = {
            id: staticP.id,
            name: staticP.name,
            price: staticP.price,
            stock: staticP.stockQuantity ?? (staticP.inStock ? 50 : 0),
            image: staticP.image,
            category: staticP.category,
          };
        }
        // There is deliberately no third fallback. A previous revision, on failing to
        // resolve an id, built the line from `item.name`, `item.price` and `item.image`
        // in the request body and assumed `stock: 50`. That let a caller name a real
        // product, set its price to anything, alter the id just enough to miss both
        // lookups, and be charged the price they chose — verified: a Rs 99 catalogue
        // item billed at Rs 1, and the same line written into the orders table under the
        // real product's name. It also persisted a caller-supplied image URL.
      }

      if (!dbProd) {
        // Distinguish "we could not read the catalogue" from "this product is not in
        // it". Guessing a price for either is what created the hole above.
        if (catalogueLookupFailed) {
          return res.status(503).json({
            error: "Could not verify product pricing right now. Please try again in a moment.",
          });
        }
        return res
          .status(400)
          .json({ error: `Product ID '${item.id}' does not exist in catalog.` });
      }

      // Strict: no `|| 1` fallback. The old coercion silently turned an explicit 0 — and
      // any unparseable value — into one unit, charging for something never asked for.
      const qty = parsePositiveQuantity(item.qty);
      if (qty === null) {
        return res.status(400).json({ error: `Invalid quantity '${String(item.qty)}' for '${dbProd.name}'.` });
      }

      const availableStock = Number(dbProd.stock ?? dbProd.stock_quantity ?? 50);
      if (availableStock < qty) {
        return res.status(409).json({
          error: `Insufficient stock for '${dbProd.name}'. Available: ${availableStock}, requested: ${qty}.`,
          availableStock: availableStock,
          productId: dbProd.id,
        });
      }


      const unitPrice = Number(dbProd.price);

      validatedItems.push({
        id: dbProd.id,
        name: dbProd.name,
        price: unitPrice,
        qty,
        image: dbProd.image,
      });
    }

    // 3. Fetch coupon rule if provided
    let couponData = null;
    if (couponCode && typeof couponCode === "string" && couponCode.trim() && supabase) {
      try {
        const codeUpper = couponCode.trim().toUpperCase();
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", codeUpper)
          .eq("status", "ACTIVE")
          .maybeSingle();

        if (!error && data) {
          couponData = data;
        }
      } catch (e) {
        console.warn("Supabase coupon lookup warning:", e);
      }
    }

    // 4. Calculate Authoritative Totals via Central Pricing Engine
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

    // 5. Create official Razorpay Order via REST API.
    //
    // No synthetic order id is ever produced here. An id Razorpay does not know about
    // cannot be paid: the client opens checkout, the gateway rejects the unknown order,
    // and the customer sees a dead payment screen while this endpoint has already
    // reported `success: true`. Every failure below returns 502 so the caller — which
    // throws on any non-2xx — surfaces a real error instead of a broken checkout.
    //
    // Declared without an initialiser deliberately: TypeScript's definite-assignment
    // check now guarantees no path reaches the response without a gateway-issued id.
    let razorpayOrderId: string;

    try {
      const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: pricing.amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            userEmail: userEmail || "",
            userPhone: userPhone || "",
            itemsCount: validatedItems.length,
          },
        }),
        // Abort ahead of Vercel's own function timeout so a hung gateway becomes a
        // structured 502 rather than an opaque platform 504.
        signal: AbortSignal.timeout(8000),
      });

      if (!rzpRes.ok) {
        // Logged server-side only: the gateway's raw error body can name account and
        // key configuration details that should not be echoed to the browser.
        const errText = await rzpRes.text().catch(() => "<unreadable body>");
        console.error("Razorpay API error response:", rzpRes.status, errText);
        return res.status(502).json({
          error: "Payment gateway rejected order creation. Please try again in a moment.",
        });
      }

      const rzpData = await rzpRes.json();
      if (!rzpData || typeof rzpData.id !== "string" || !rzpData.id) {
        console.error("Razorpay returned no usable order id:", rzpData);
        return res.status(502).json({
          error: "Payment gateway returned an unusable order. Please try again in a moment.",
        });
      }

      razorpayOrderId = rzpData.id;
    } catch (fetchErr: any) {
      console.error("Error communicating with Razorpay API:", fetchErr?.message || fetchErr);
      return res.status(502).json({
        error: "Could not reach the payment gateway. Please try again in a moment.",
      });
    }

    return res.status(200).json({
      success: true,
      razorpayOrderId,
      keyId: RAZORPAY_KEY_ID,
      currency: "INR",
      amount: pricing.amountInPaise,
      orderSummary: {
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        discountPercent: couponData?.discount_type === "PERCENTAGE" ? Number(couponData.discount_value) : 0,
        couponCode: pricing.couponCode,
        shippingFee: pricing.shippingFee,
        gstAmount: pricing.gstAmount,
        total: pricing.finalTotal,
        items: validatedItems,
      },
    });
  } catch (error: any) {
    console.error("Server error creating Razorpay order:", error);
    return res.status(500).json({ error: "Unable to create payment order. Please try again in a moment." });
  }
}
