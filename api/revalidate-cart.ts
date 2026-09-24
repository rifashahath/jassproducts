import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
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

  // The price oracle for guest carts. Looser than the payment endpoints but
  // still bounded: it does one or more database reads per call and its coupon
  // branch is an enumeration oracle if left unthrottled.
  const rl = checkRateLimit(`revalidate-cart:${getClientBucketKey(req)}`, 60, 60 * 1000);
  if (!rl.allowed) {
    console.warn("Rate limit hit on revalidate-cart, retry after", rl.retryAfterSeconds, "s");
    return rateLimitResponse(res, rl);
  }

  try {
    const { items, couponCode } = req.body || {};

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ error: "Invalid request. 'items' must contain between 1 and 100 products." });
    }

    const supabase = getSupabaseClient();
    const productIds = items.map((i: any) => String(i.id));
    let dbProducts: any[] = [];

    // This endpoint's whole purpose is to tell the client what the authoritative price
    // is. If the catalogue could not be read, it must say so rather than return numbers
    // that look authoritative but are not.
    let catalogueLookupFailed = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, price, stock, image, category, slug")
          .in("id", productIds);
        if (error) {
          console.error("Product catalogue lookup failed during revalidation:", error);
          catalogueLookupFailed = true;
        } else if (Array.isArray(data)) {
          dbProducts = data;
        }
      } catch (e) {
        console.error("Product catalogue lookup threw during revalidation:", e);
        catalogueLookupFailed = true;
      }
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
          };
        }
        // No third fallback. A previous revision built the line from `item.name` and
        // `item.price` in the request body, so the "revalidated" price echoed back to the
        // cart was whatever the caller had sent — the one thing this endpoint exists to
        // rule out.
      }
      if (!dbProd) {
        if (catalogueLookupFailed) {
          // Reporting an unreadable catalogue as "no longer available" would silently
          // empty a customer's cart during a database blip.
          return res.status(503).json({
            error: "Could not check product prices and availability. Please try again in a moment.",
          });
        }
        warnings.push(`Item '${item.name || item.id}' is no longer available in store.`);
        continue;
      }

      const clientPrice = Number(item.clientPrice);
      const serverPrice = Number(dbProd.price);
      if (clientPrice && clientPrice !== serverPrice) {
        warnings.push(
          `Price for '${dbProd.name}' changed from ₹${clientPrice.toLocaleString("en-IN")} to ₹${serverPrice.toLocaleString("en-IN")}.`,
        );
      }

      const qty = parsePositiveQuantity(item.qty) ?? 0;
      if (qty === 0) {
        warnings.push(`Invalid quantity for '${dbProd.name}'; please update your cart.`);
        hasStockIssue = true;
        continue;
      }
      const availableStock = Number(dbProd.stock ?? dbProd.stock_quantity ?? 50);
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
        console.warn("Supabase coupon lookup error in revalidate-cart:", e);
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

    return res.status(200).json({
      valid: !hasStockIssue,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      discountPercent: couponData?.discount_type === "PERCENTAGE" ? Number(couponData.discount_value) : 0,
      shippingFee: pricing.shippingFee,
      gstAmount: pricing.gstAmount,
      total: pricing.finalTotal,
      items: validatedItems,
      warnings,
    });
  } catch (error: any) {
    console.error("Cart revalidation error:", error);
    return res.status(500).json({ error: "Unable to validate cart pricing. Please try again in a moment." });
  }
}
