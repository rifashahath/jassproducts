import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { checkRateLimit, getClientBucketKey, rateLimitResponse } from "./_rate-limit.ts";
import { calculateOrderPricing } from "../src/lib/pricing-calculator.ts";
import { parsePositiveQuantity } from "../src/lib/pricing-calculator.ts";
import { products as staticProducts, getProductSlug } from "../src/lib/products.ts";
import {
  adjustProductStock,
  describeStockFailure,
  type StockClient,
} from "../src/lib/stock-ledger.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_SECRET ||
  "";

// Needed by the captured-amount cross-check below (GET /v1/payments/{id}); without it
// the check cannot run, and the handler fails closed rather than record an unverified total.
const RAZORPAY_KEY_ID =
  process.env.VITE_RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  "";

/**
 * Conservative charset for every identifier that reaches a database filter or is
 * persisted as an order reference. Razorpay ids (`pay_…`, `order_…`) and this app's
 * own order references all satisfy it. Defence in depth: the queries below are
 * parameterised, but this also keeps malformed references out of the orders table.
 */
const SAFE_IDENTIFIER = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Crockford base32 — no I, L, O or U, so a reference read aloud to support cannot be
 * transcribed ambiguously.
 */
const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Allocates an order reference. The browser must never choose this value.
 *
 * The previous revision minted `VRD-${Math.floor(100000 + Math.random() * 900000)}`
 * client-side, which failed three separate ways: only 900,000 possible references
 * (≈50% chance of a collision by the ~1,100th order), trivially forgeable by anyone
 * editing the request, and — because it was evaluated in a React component body —
 * regenerated on every render, so the reference shown on the confirmation screen was
 * not the one written to the database.
 *
 * Format: `VRD-YYMMDD-XXXXXXXX`. The date segment makes references sort and triage
 * naturally and discloses only the order date, which the customer already knows. The
 * suffix is 8 crypto-random Crockford characters (40 bits). 256 is a whole multiple of
 * the 32-character alphabet, so the modulo below is unbiased.
 */
export function generateOrderReference(now: Date = new Date()): string {
  const yy = String(now.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  const bytes = crypto.randomBytes(8);
  let suffix = "";
  for (let i = 0; i < bytes.length; i++) {
    suffix += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }

  return `VRD-${yy}${mm}${dd}-${suffix}`;
}

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

/**
 * Constant-time Razorpay HMAC-SHA256 signature verification.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const signatureBuf = Buffer.from(signature, "utf-8");
  const expectedBuf = Buffer.from(expectedSignature, "utf-8");

  if (signatureBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuf, expectedBuf);
}

/**
 * Fetches the captured payment directly from Razorpay.
 *
 * The HMAC the checkout returns covers `${order_id}|${payment_id}` and nothing else — not
 * the amount, not the items. The signature therefore proves the pair is real, not that the
 * amount charged has anything to do with the items the caller now declares. The gateway's
 * own record of the payment is the only independent statement of what was actually
 * charged, so the handler refuses to record an order until it has read that record and
 * compared.
 *
 * Fail-closed by design: a gateway outage here returns 503 with the payment id for
 * support reconciliation, never a recorded order of unverified value. The payment itself
 * is safe — it was captured and signature-verified — so "not recorded yet" is always the
 * recoverable state.
 */
async function fetchRazorpayPayment(
  paymentId: string
): Promise<{ ok: true; payment: Record<string, unknown> } | { ok: false; reason: string }> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return { ok: false, reason: "Razorpay key id/secret are not configured for the amount check" };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: authHeader },
      // Same rationale as create-razorpay-order: abort ahead of the platform timeout so a
      // hung gateway becomes a structured 503 rather than an opaque 504.
      signal: AbortSignal.timeout(8000),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text().catch(() => "<unreadable body>");
      // Server-side only: the gateway body can name account and key configuration.
      console.error("Razorpay payment fetch failed:", rzpRes.status, errText);
      return { ok: false, reason: `gateway responded ${rzpRes.status}` };
    }

    const payment = (await rzpRes.json()) as Record<string, unknown>;
    if (!payment || typeof payment.id !== "string" || !payment.id) {
      return { ok: false, reason: "gateway returned an unusable payment record" };
    }
    return { ok: true, payment };
  } catch (err: any) {
    return { ok: false, reason: err?.message || String(err) };
  }
}

/**
 * Why the process_order_atomic RPC failed, for logging and alerting only.
 *
 * This is reached exclusively after Razorpay has captured the payment, so it is never a
 * decision about whether to accept the order — it is already paid for. Every kind routes
 * to the same transactional fallback, which records the order with server-derived pricing.
 * The classification exists because "the function did not run" and "the function ran and
 * objected" need different people to look at them.
 *
 * The previous code decided this with
 *   rpcError.message.includes("function public.process_order_atomic") ||
 *   rpcError.message.includes("schema cache")
 * and returned `409 { error }` for everything else, recording no order at all. Measured
 * against the real function in a local PostgreSQL 17 cluster: when the caller holds the
 * anon key rather than a service-role key, PostgREST reports
 *   SQLSTATE 42501  permission denied for function process_order_atomic
 * — note the absence of a "public." prefix — so neither substring matched, the fallback
 * was skipped, and the handler returned 409 for a captured payment with nothing written to
 * the orders table. `anon` is already revoked on this function, so that was the live
 * behaviour whenever SUPABASE_SERVICE_ROLE_KEY was unset in the deployment.
 */
export type OrderRpcFailureKind = "unavailable" | "rejected" | "unknown";

export function classifyOrderRpcFailure(
  err: { message?: string | null; code?: string | null } | null | undefined
): OrderRpcFailureKind {
  if (!err) return "unknown";

  const code = (err.code || "").toUpperCase();
  const message = (err.message || "").toLowerCase();

  // The function was never executed: absent, ambiguous, or not executable by this key.
  //   PGRST202  no matching function in the schema cache
  //   PGRST203  more than one candidate overload
  //   42883     undefined_function
  //   42501     insufficient_privilege
  //   3F000     invalid_schema_name
  const unavailableCodes = ["PGRST202", "PGRST203", "42883", "42501", "3F000"];
  if (unavailableCodes.includes(code)) return "unavailable";

  if (
    message.includes("schema cache") ||
    message.includes("could not find the function") ||
    message.includes("could not choose the best candidate function") ||
    message.includes("permission denied for function") ||
    message.includes("function public.process_order_atomic") ||
    /function .*process_order_atomic.* does not exist/.test(message)
  ) {
    return "unavailable";
  }

  // The function ran and refused. P0001 is a plpgsql RAISE; the 23xxx family is a
  // constraint the row violated. Both mean the database saw a reason not to write this
  // order as given — most plausibly stock that dropped between the availability check
  // above and the RPC.
  if (code === "P0001" || code.startsWith("23")) return "rejected";

  return "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Verification is where stolen/guessed signature attempts land, so it gets a
  // per-IP budget alongside the HMAC check itself.
  const rl = checkRateLimit(`verify-payment:${getClientBucketKey(req)}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    console.warn("Rate limit hit on verify-razorpay-payment, retry after", rl.retryAfterSeconds, "s");
    return rateLimitResponse(res, rl);
  }

  // 1. Fail-Closed Check: Ensure payment gateway secret is configured
  if (!RAZORPAY_KEY_SECRET) {
    console.error("Payment verification rejected: RAZORPAY_KEY_SECRET is not configured on server.");
    return res.status(500).json({
      error: "Payment gateway configuration error. Please contact store support.",
    });
  }

  try {
    // Note the absence of `orderId`. The order reference is allocated server-side in
    // section 4b; any value the browser sends is ignored rather than rejected, so a
    // client still holding the old bundle mid-session completes checkout normally.
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userEmail,
      userPhone,
      items,
      shippingAddress,
      couponCode,
    } = req.body || {};

    // 2. Strict Parameter Validation
    if (!razorpay_order_id || typeof razorpay_order_id !== "string" || !razorpay_order_id.trim()) {
      return res.status(400).json({ error: "Missing required razorpay_order_id." });
    }
    if (!razorpay_payment_id || typeof razorpay_payment_id !== "string" || !razorpay_payment_id.trim()) {
      return res.status(400).json({ error: "Missing required razorpay_payment_id." });
    }
    if (!razorpay_signature || typeof razorpay_signature !== "string" || !razorpay_signature.trim()) {
      return res.status(400).json({ error: "Missing required razorpay_signature." });
    }
    if (!SAFE_IDENTIFIER.test(razorpay_payment_id.trim())) {
      return res.status(400).json({ error: "Malformed razorpay_payment_id." });
    }
    if (!SAFE_IDENTIFIER.test(razorpay_order_id.trim())) {
      return res.status(400).json({ error: "Malformed razorpay_order_id." });
    }
    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ error: "Missing or invalid items array in order payload." });
    }

    // 3. Official Razorpay HMAC-SHA256 Cryptographic Verification (Constant-Time)
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id.trim(),
      razorpay_payment_id.trim(),
      razorpay_signature.trim(),
      RAZORPAY_KEY_SECRET
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        error: "Invalid Razorpay payment signature. Verification failed.",
      });
    }

    const supabase = getSupabaseClient();

    // Fail-closed: with no database client every persistence step below is skipped and
    // the handler still returns `success: true`, producing an unreconcilable
    // "payment captured, order missing" state. A 500 keeps the payment recoverable.
    if (!supabase) {
      console.error(
        "Payment verification aborted: Supabase is not configured, so the order cannot be persisted."
      );
      return res.status(500).json({
        error:
          "Database configuration error. Your payment was received but the order could not be recorded — please contact support with your payment ID.",
      });
    }

    // 4a. Resolve caller identity.
    //
    // `userId`/`userEmail`/`userPhone` arrive from the request body, and the previous
    // revision wrote them into the order with service-role privileges — so anyone who had
    // completed any payment could file that order under another customer's user id,
    // making it appear in the victim's account history (and cancellable by them, with the
    // stock restore that entails).
    //
    // Now the Authorization header, when the browser sends one, is the only source of
    // identity: the token is verified with GoTrue and its subject, email and phone win
    // over the body in every case. A body `userId` that does not match the verified token
    // is ignored (the token wins) and the substitution is logged — never a 4xx, because
    // this point is after the money was captured and the order must still be recorded.
    // A request with no valid token is a guest checkout: user_id stays NULL, which the
    // orders INSERT policy admits, and the guest's own email/phone are used for the
    // receipt exactly as before.
    let verifiedUserId: string | null = null;
    let verifiedUserEmail: string | null = null;
    let verifiedUserPhone: string | null = null;

    const bearerToken = (req.headers?.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (bearerToken) {
      const { data: verified, error: verifyError } = await supabase.auth.getUser(bearerToken);
      if (!verifyError && verified?.user) {
        verifiedUserId = verified.user.id;
        verifiedUserEmail = verified.user.email || null;
        verifiedUserPhone = verified.user.phone || null;
      } else {
        console.warn("Payment verify: a Bearer token was present but did not verify.", verifyError?.message);
      }
    }

    const requestedUserId =
      typeof userId === "string" && userId.trim() ? userId.trim() : null;
    if (requestedUserId && verifiedUserId && requestedUserId !== verifiedUserId) {
      console.warn(
        "ORDER_IDENTITY_OVERRIDDEN",
        JSON.stringify({
          paymentId: razorpay_payment_id,
          requestedUserId,
          verifiedUserId,
        })
      );
    }
    // Body-supplied values are used only when no verified session exists (guest checkout).
    const effectiveUserId = verifiedUserId;
    const effectiveUserEmail =
      verifiedUserEmail || (typeof userEmail === "string" && userEmail.trim() ? userEmail.trim() : "customer@example.com");
    const effectiveUserPhone =
      verifiedUserPhone || (typeof userPhone === "string" && userPhone.trim() ? userPhone.trim() : "");

    // 4. Idempotency check, keyed on the gateway's payment id.
    //
    // The payment id is the one value that uniquely identifies a captured payment, and
    // it is covered by the signature verified above, so a caller cannot choose it.
    //
    // This was previously a single composed filter,
    // `.or(\`payment_id.eq.${…},id.eq.${…}\`)`, interpolating a caller-controlled order
    // id into PostgREST filter *grammar* — a crafted value appended its own OR
    // conditions and read back another customer's order id, status and total. Nothing
    // is interpolated into a filter expression here; `.eq()` sends its argument as a
    // single percent-encoded parameter value.
    //
    // The lookup fails closed. A failed lookup must not be read as "no existing order",
    // because that conclusion leads directly to processing a payment twice.

    const { data: paidOrder, error: paidLookupError } = await supabase
      .from("orders")
      .select("id, status, total")
      .eq("payment_id", razorpay_payment_id.trim())
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (paidLookupError) {
      console.error(
        "Idempotency lookup failed for payment",
        razorpay_payment_id,
        paidLookupError
      );
      return res.status(500).json({
        error:
          "Could not confirm whether this payment was already processed. Your payment was received — please contact support with your payment ID rather than retrying.",
      });
    }

    if (paidOrder) {
      return res.status(200).json({
        success: true,
        orderId: paidOrder.id,
        status: paidOrder.status,
        total: paidOrder.total,
        message: "Order already processed (idempotent response).",
      });
    }

    // 4b. Allocate the order reference server-side.
    //
    // The reference is generated here, not in the browser, and any `orderId` in the
    // request body is ignored. Because the value is now server-chosen from a 40-bit
    // random space, a collision is a remote accident rather than the near-certainty it
    // was at 900,000 possible client-side values — but the loop still checks, because
    // writing a second order onto an existing reference would overwrite a real order.
    //
    // Bounded at 5 attempts: an unbounded retry against a persistent fault would hold
    // the function open until the platform kills it, losing the payment record
    // entirely. Failing after five gives support a logged payment id to reconcile.
    let orderReference = "";

    for (let attempt = 0; attempt < 5 && !orderReference; attempt++) {
      const candidate = generateOrderReference();

      const { data: taken, error: referenceLookupError } = await supabase
        .from("orders")
        .select("id")
        .eq("id", candidate)
        .maybeSingle();

      if (referenceLookupError) {
        console.error(
          "Order reference availability lookup failed for payment",
          razorpay_payment_id,
          referenceLookupError
        );
        return res.status(500).json({
          error:
            "Could not allocate an order reference. Your payment was received — please contact support with your payment ID rather than retrying.",
        });
      }

      if (!taken) {
        orderReference = candidate;
      }
    }

    if (!orderReference) {
      console.error(
        "Exhausted 5 attempts allocating a unique order reference for payment",
        razorpay_payment_id
      );
      return res.status(500).json({
        error:
          "Could not allocate an order reference. Your payment was received — please contact support with your payment ID rather than retrying.",
      });
    }

    // 5. Authoritative Server-Side Product Lookup & Price Recalculation
    const productIds = items.map((i: any) => String(i.id));
    let dbProducts: any[] = [];

    // See create-razorpay-order: a failed catalogue read and a nonexistent product need
    // different responses, and neither may result in a guessed price.
    let catalogueLookupFailed = false;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock, image, slug")
        .in("id", productIds);
      if (error) {
        console.error("Product catalogue lookup failed during verification:", error);
        catalogueLookupFailed = true;
      } else if (Array.isArray(data)) {
        dbProducts = data;
      }
    } catch (e) {
      console.error("Product catalogue lookup threw during verification:", e);
      catalogueLookupFailed = true;
    }

    const productMap = new Map<string, any>();
    dbProducts.forEach((p) => {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    });

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
          };
        }
        // No third fallback. A previous revision built the line from `item.name`,
        // `item.price` and `item.image` in the request body and assumed `stock: 50` —
        // i.e. the amount recorded for a captured payment was chosen by the caller.
      }

      if (!dbProd) {
        // Money has already been captured at this point, so both responses have to hand
        // the customer something support can act on rather than a bare validation error.
        if (catalogueLookupFailed) {
          return res.status(503).json({
            error:
              "Could not verify product pricing, so the order was not recorded. Your payment was received — please contact support with your payment ID: " +
              razorpay_payment_id,
          });
        }
        return res.status(400).json({
          error:
            `Product '${item.id}' is not in the catalogue, so the order was not recorded. ` +
            "Your payment was received — please contact support with your payment ID: " +
            razorpay_payment_id,
        });
      }
      // Strict: no `|| 1` fallback. The old `parseInt(item.qty, 10) || 1` silently turned
      // an explicit 0 — and any unparseable value — into one unit, ordering something the
      // caller never asked for. A malformed quantity is a caller bug and is rejected.
      const qty = parsePositiveQuantity(item.qty);
      if (qty === null) {
        return res.status(400).json({
          error: `Invalid quantity '${String(item.qty)}' for product '${item.id}'.`,
        });
      }
      const availableStock = Number(dbProd.stock ?? 50);
      if (availableStock < qty) {
        return res.status(409).json({
          error: `Insufficient stock for '${dbProd.name}'. Available: ${availableStock}, requested: ${qty}.`,
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

    // 6. Server-Side Coupon Revalidation
    let couponData = null;
    if (couponCode && typeof couponCode === "string" && couponCode.trim() && supabase) {
      try {
        const codeUpper = couponCode.trim().toUpperCase();
        const { data } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", codeUpper)
          .eq("status", "ACTIVE")
          .maybeSingle();

        if (data) {
          couponData = data;
        }
      } catch (e) {
        console.warn("Supabase coupon lookup error in verification:", e);
      }
    }

    // 7. Compute Authoritative Order Totals via Shared Engine
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

    // 7b. Cross-check the captured amount against the authoritative total.
    //
    // The signature verified in step 3 proves this payment exists and belongs to this
    // order id — it does NOT cover the amount or the items. The items above were
    // re-validated against the catalogue, but they are still the caller's choice, and
    // without this check a caller could pay for the cheapest product and then declare
    // expensive ones here: the catalogue check passes, pricing recomputes from the new
    // items, and an order worth many times the captured amount gets recorded. The
    // gateway's own payment record is the independent statement of what was charged.
    const paymentRecord = await fetchRazorpayPayment(razorpay_payment_id.trim());
    if (!paymentRecord.ok) {
      console.error(
        "PAYMENT_AMOUNT_UNVERIFIABLE",
        JSON.stringify({ paymentId: razorpay_payment_id, reason: paymentRecord.reason })
      );
      return res.status(503).json({
        error:
          "Could not confirm the captured amount with the payment gateway, so the order was not recorded. Your payment was received — please contact support with your payment ID: " +
          razorpay_payment_id,
      });
    }

    const gatewayPayment = paymentRecord.payment;
    if (gatewayPayment.order_id !== razorpay_order_id.trim()) {
      console.error(
        "PAYMENT_ORDER_BINDING_MISMATCH",
        JSON.stringify({
          paymentId: razorpay_payment_id,
          expectedOrderId: razorpay_order_id,
          gatewayOrderId: gatewayPayment.order_id,
        })
      );
      return res.status(400).json({
        error: "This payment does not belong to the Razorpay order it was submitted with.",
      });
    }

    const capturedAmountPaise = Number(gatewayPayment.amount);
    const gatewayStatus = String(gatewayPayment.status || "");
    if (gatewayStatus !== "captured") {
      console.error(
        "PAYMENT_NOT_CAPTURED",
        JSON.stringify({ paymentId: razorpay_payment_id, status: gatewayStatus })
      );
      return res.status(409).json({
        error: `Payment is not captured (status: ${gatewayStatus || "unknown"}) and was not applied to an order.`,
      });
    }
    if (!Number.isFinite(capturedAmountPaise) || capturedAmountPaise !== pricing.amountInPaise) {
      // A mismatch most plausibly means the catalogue or the coupon changed between the
      // gateway order being created (which priced the caller's original cart) and this
      // verification — or that the caller substituted items. Either way the caller has
      // paid an amount that does not correspond to the items now being declared, and
      // recording them would be billing whatever the caller chose.
      console.error(
        "ORDER_AMOUNT_MISMATCH",
        JSON.stringify({
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          charged: capturedAmountPaise,
          computedForDeclaredItems: pricing.amountInPaise,
        })
      );
      return res.status(409).json({
        error:
          "The amount you paid does not match the current total for these items. The order was not recorded and no goods are reserved — please contact support with your payment ID: " +
          razorpay_payment_id +
          " to either complete the order at the paid amount or arrange a refund.",
      });
    }

    const paymentMethod = `RAZORPAY (${razorpay_payment_id})`;

    // Populated only by the fallback path below, when the order was recorded but its
    // stock movement could not be completed. Declared out here so the response can
    // report it instead of returning an unqualified success.
    const stockWarnings: string[] = [];

    // Populated when the database derived different figures from the ones computed here,
    // or when it had something to say about the coupon. Additive: the order and the
    // payment are sound either way.
    const pricingNotes: string[] = [];
    let recordedTotal: number | null = null;

    // 8. Execute Atomic Order + Stock Transaction RPC (if Supabase configured)
    if (supabase) {
      const { data: rpcData, error: rpcError } = await supabase.rpc("process_order_atomic", {
        p_order_id: orderReference,
        p_user_id: effectiveUserId,
        p_user_email: effectiveUserEmail,
        p_user_phone: effectiveUserPhone,
        p_items: validatedItems,
        p_subtotal: pricing.subtotal,
        p_shipping_cost: pricing.shippingFee,
        p_discount: pricing.discountAmount,
        p_gst: pricing.gstAmount,
        p_total: pricing.finalTotal,
        p_payment_method: paymentMethod,
        p_shipping_address: shippingAddress || {},
        p_coupon_code: couponCode || null,
        // The gateway identifiers. Without p_payment_id the RPC left orders.payment_id
        // NULL, and both the idempotency lookup at the top of this handler and the partial
        // unique index that backs it key on that column — so neither covered the primary
        // path. Measured on the pre-fix function: after a successful RPC,
        // `SELECT count(*) FROM orders WHERE payment_id = '<the captured payment>'`
        // returned 0, and because each request generates a fresh order reference, a
        // replayed payment produced a second order.
        p_payment_id: razorpay_payment_id,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_signature: razorpay_signature,
      });

      if (rpcError) {
        // The payment is captured. Nothing below is a decision about whether to accept the
        // order — the only question is whether it gets recorded, and the answer is always
        // yes. The previous code returned `409 { error: rpcError.message }` for any failure
        // it did not recognise as "function missing", which lost the order entirely while
        // keeping the customer's money. See classifyOrderRpcFailure above for the measured
        // case that hit in production configuration.
        const failureKind = classifyOrderRpcFailure(rpcError);

        console.error(
          "ORDER_RPC_FALLBACK",
          JSON.stringify({
            kind: failureKind,
            orderId: orderReference,
            paymentId: razorpay_payment_id,
            code: rpcError.code || null,
            message: rpcError.message || null,
          })
        );

        {
          const { error: insertError } = await supabase.from("orders").insert({
            id: orderReference,
            user_id: effectiveUserId,
            user_email: effectiveUserEmail,
            customer_name: shippingAddress?.fullName || effectiveUserEmail,
            customer_email: effectiveUserEmail,
            user_phone: effectiveUserPhone || shippingAddress?.phone || null,
            phone: effectiveUserPhone || shippingAddress?.phone || null,
            items: validatedItems,
            items_summary: validatedItems.map((i) => `${i.name} (x${i.qty})`).join(", "),
            subtotal: pricing.subtotal,
            shipping_cost: pricing.shippingFee,
            discount: pricing.discountAmount,
            gst: pricing.gstAmount,
            total: pricing.finalTotal,
            total_amount: pricing.finalTotal,
            status: "PROCESSING",
            payment_method: paymentMethod,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            razorpay_signature: razorpay_signature,
            shipping_address: shippingAddress || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // 23505 is unique_violation. Reaching it here means this order reference or this
          // payment is already recorded — the RPC committed and its response was lost, or a
          // concurrent request won. Either way the order exists, which is the outcome this
          // path is trying to produce, so it is a success and not a 500. The stock movement
          // belongs to whichever write succeeded, so it is not repeated.
          if (insertError && insertError.code !== "23505") {
            console.error("Serverless order insertion failed:", insertError);
            return res.status(500).json({ error: "Failed to persist verified order in database." });
          }

          if (insertError) {
            console.warn(
              `Order ${orderReference} was already recorded for payment ${razorpay_payment_id}; treating as idempotent.`
            );
          } else {
            // Decrement stock for each item server-side with service_role privileges.
            //
            // Every write is a compare-and-swap against a freshly read value — see
            // src/lib/stock-ledger.ts. The previous revision read from `productMap`, a
            // snapshot taken several round trips earlier, defaulted to a hardcoded 50 when
            // the line had resolved from the static seed, and wrote the result as an
            // absolute value with its error discarded. Verified against that code: two
            // orders for the same product at real stock 10 both wrote 9; a seed-resolved
            // line wrote `50 - qty` over the real row; and a write rejected with SQLSTATE
            // 42501 still produced `200 {success: true}` plus an inventory_logs row
            // claiming the movement had happened.
            const stockFailures: string[] = [];

            for (const item of validatedItems) {
              const outcome = await adjustProductStock(supabase as unknown as StockClient, {
                productId: item.id,
                delta: -item.qty,
                type: "SALE",
                reason: `Order verified: ${orderReference}`,
              });

              if (!outcome.ok) {
                stockFailures.push(describeStockFailure(outcome));
              } else if (!outcome.auditLogged) {
                console.warn(
                  `Stock moved for product ${item.id} but its inventory_logs row was not written (order ${orderReference}).`
                );
              }
            }

            // The order row is already committed and the payment is captured, so the sale
            // is not unwound over an inventory problem. But it must not be silent either:
            // an undecremented item stays sellable and will be oversold to the next
            // customer. This is logged with a fixed marker so a log drain can alert on it,
            // and reported in the response so it is visible without log access.
            if (stockFailures.length > 0) {
              console.error(
                "STOCK_RECONCILIATION_REQUIRED",
                JSON.stringify({
                  orderId: orderReference,
                  paymentId: razorpay_payment_id,
                  failures: stockFailures,
                })
              );
              stockWarnings.push(
                "Inventory for this order requires manual reconciliation.",
                ...stockFailures
              );
            }
          }
        }
      } else if (rpcData && typeof rpcData === "object") {
        // The RPC now derives every figure from the locked catalogue and coupon rows rather
        // than writing the ones passed to it, and reports when the two disagree. Its values
        // are what the orders table holds, so they are what this response reports.
        const recorded = (rpcData as any).pricing;
        if (recorded && Number.isFinite(Number(recorded.total))) {
          recordedTotal = Number(recorded.total);
        }

        if ((rpcData as any).pricing_mismatch) {
          // The amount actually charged was computed by create-razorpay-order.ts. If the
          // database derived something different, the customer paid one figure and the
          // order holds another — most plausibly because a price or coupon changed while
          // they were on the payment sheet. Logged under a fixed marker; the order stands
          // because reversing a captured payment here would be worse than a correction.
          console.error(
            "ORDER_PRICING_MISMATCH",
            JSON.stringify({
              orderId: orderReference,
              paymentId: razorpay_payment_id,
              charged: pricing.finalTotal,
              recorded: recordedTotal,
              supplied: {
                subtotal: pricing.subtotal,
                shipping: pricing.shippingFee,
                discount: pricing.discountAmount,
                gst: pricing.gstAmount,
                total: pricing.finalTotal,
              },
              derived: recorded ?? null,
            })
          );
          pricingNotes.push(
            "This order's totals were re-derived by the database and require review."
          );
        }

        const notes = (rpcData as any).notes;
        if (Array.isArray(notes) && notes.length > 0) {
          // Coupon outcomes the database recorded rather than raised on — expired, paused,
          // unknown code, minimum not met, usage limit exceeded. Previously each of these
          // raised, and the handler turned the exception into a 409 that discarded a paid
          // order.
          console.warn(
            "ORDER_COUPON_NOTES",
            JSON.stringify({ orderId: orderReference, notes })
          );
          pricingNotes.push(...notes.map((n: unknown) => String(n)));
        }
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderReference,
      status: "Processing",
      // The database re-derives the totals and its values are what the orders table holds,
      // so they are what gets reported. Falls back to the figure computed here when the RPC
      // did not run (the fallback insert writes exactly this value).
      total: recordedTotal ?? pricing.finalTotal,
      message: "Payment successfully verified and order processed.",
      // Additive and normally absent. The order and payment are sound either way, so
      // this is not an error — it is the difference between a clean success and one that
      // needs an inventory correction, which the previous revision reported identically.
      ...(stockWarnings.length > 0 ? { stockWarnings } : {}),
      // Also additive: why a coupon did not apply, or that the recorded totals differ from
      // the ones this handler computed. Never a reason to fail the request.
      ...(pricingNotes.length > 0 ? { pricingNotes } : {}),
    });
  } catch (error: any) {
    console.error("Server error verifying Razorpay payment:", error.message || error);
    return res.status(500).json({ error: "Internal server error while verifying payment." });
  }
}
