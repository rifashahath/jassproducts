/**
 * Single Authoritative Business & Pricing Calculator for Jass Products.
 * Used identically across serverless endpoints, database transactions, and UI previews.
 */

export type PositiveQuantity = number | null;

/**
 * Parse a quantity without JavaScript's permissive parseInt coercion.
 * JSON numbers and numeric strings are accepted only when they represent a
 * whole number in the supported per-line range.
 */
export function parsePositiveQuantity(value: unknown, max = 99): PositiveQuantity {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > max) return null;
  return parsed;
}

export interface PricingConfig {
  standardShippingFee: number;
  expressShippingFee: number;
  freeShippingThreshold: number;
  gstRate: number; // e.g. 0.18 for 18% GST
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  standardShippingFee: 499,
  expressShippingFee: 699,
  freeShippingThreshold: 5000,
  gstRate: 0.18,
};

export interface OrderItemLine {
  id?: string;
  price: number;
  qty: number;
  name?: string;
}

export interface CouponRule {
  code: string;
  discountType: string | "PERCENTAGE" | "FIXED" | "FLAT" | "PERCENT" | "AMOUNT";
  discountValue: number;
  maxDiscountCap?: number | null;
  minOrderAmount?: number | null;
  expiryDate?: string | null;
  status?: string;
}

export interface OrderCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  shippingFee: number;
  shippingMethod: "standard" | "express";
  gstAmount: number;
  finalTotal: number;
  amountInPaise: number;
  isFreeShipping: boolean;
  couponApplied: boolean;
  couponCode: string | null;
}

/**
 * Authoritatively calculates all line amounts, discounts, shipping tiers, GST, and final paise total.
 * Enforces integer arithmetic guarantees and strict rounding behavior.
 */
export function calculateOrderPricing(
  items: OrderItemLine[],
  options?: {
    shippingMethod?: "standard" | "express";
    coupon?: CouponRule | null;
    config?: Partial<PricingConfig>;
  }
): OrderCalculationResult {
  const config: PricingConfig = {
    ...DEFAULT_PRICING_CONFIG,
    ...options?.config,
  };

  const shippingMethod = options?.shippingMethod === "express" ? "express" : "standard";

  // 1. Calculate Authoritative Subtotal
  let rawSubtotal = 0;
  if (Array.isArray(items)) {
    for (const item of items) {
      const unitPrice = Math.max(0, Number(item.price) || 0);
      const qty = Math.max(0, Math.floor(Number(item.qty) || 0));
      rawSubtotal += unitPrice * qty;
    }
  }
  const subtotal = Math.round(rawSubtotal);

  // 2. Validate & Calculate Coupon Discount
  let discountAmount = 0;
  let couponApplied = false;
  let appliedCode: string | null = null;

  const coupon = options?.coupon;
  if (coupon && coupon.code && subtotal > 0) {
    const isStatusActive = !coupon.status || coupon.status.toUpperCase() === "ACTIVE";
    const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) >= new Date();
    const meetsMinOrder = !coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount);

    if (isStatusActive && isNotExpired && meetsMinOrder) {
      const discountTypeUpper = (coupon.discountType || "PERCENTAGE").toUpperCase();
      const discountVal = Number(coupon.discountValue) || 0;

      if (discountTypeUpper === "PERCENTAGE" || discountTypeUpper === "PERCENT") {
        let calculatedDiscount = Math.round((subtotal * discountVal) / 100);
        if (coupon.maxDiscountCap && calculatedDiscount > Number(coupon.maxDiscountCap)) {
          calculatedDiscount = Number(coupon.maxDiscountCap);
        }
        discountAmount = Math.min(subtotal, Math.max(0, calculatedDiscount));
      } else {
        // Flat amount discount
        discountAmount = Math.min(subtotal, Math.max(0, Math.round(discountVal)));
      }

      if (discountAmount > 0) {
        couponApplied = true;
        appliedCode = coupon.code.trim().toUpperCase();
      }
    }
  }

  // 3. Taxable Base
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // 4. Shipping Calculation
  const isFreeShipping = subtotal >= config.freeShippingThreshold || subtotal === 0;
  let shippingFee = 0;

  if (!isFreeShipping) {
    shippingFee = shippingMethod === "express" ? config.expressShippingFee : config.standardShippingFee;
  } else if (shippingMethod === "express" && subtotal > 0) {
    // When subtotal qualifies for free standard, express charges only express differential or flat express
    shippingFee = config.expressShippingFee;
  }

  // 5. Statutory GST (18%) on Taxable Product Amount
  const gstAmount = Math.round(taxableAmount * config.gstRate);

  // 6. Final Total & Razorpay Paise
  const finalTotal = Math.max(0, taxableAmount + shippingFee + gstAmount);
  const amountInPaise = Math.round(finalTotal * 100);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    shippingFee,
    shippingMethod,
    gstAmount,
    finalTotal,
    amountInPaise,
    isFreeShipping,
    couponApplied,
    couponCode: appliedCode,
  };
}
