import React, { useState, useCallback } from 'react';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Tag,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { apiUrl, readJsonResponse } from '../lib/api-endpoints.ts';
import { formatINR } from '../lib/format.ts';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface CreateOrderResponse {
  razorpayOrderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  orderId: string;
  status: string;
  total: number;
  message?: string;
  stockWarnings?: string[];
  couponNote?: string;
  error?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

/**
 * Loads the Razorpay Checkout script once. Resolves false when the script
 * cannot be loaded (ad blocker, network failure) so the caller can surface a
 * retry state instead of a silent no-op.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    items,
    subtotal,
    discountAmount,
    shippingFee,
    gstAmount,
    total,
    appliedCoupon,
    pricingLoading,
    pricingError,
    clearCart,
    refreshPricing,
  } = useCart();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStage, setPaymentStage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<{
    orderId: string;
    date: string;
    total: number;
    email: string;
  } | null>(null);

  const shippingAddress = {
    name: `${formData.firstName} ${formData.lastName}`.trim(),
    line1: formData.address,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
    country: formData.country,
    phone: formData.phone,
  };

  /**
   * STEP 2 of the payment pipeline: after Razorpay returns the signature, the
   * browser MUST POST it to /api/verify-razorpay-payment. That handler
   * verifies the HMAC signature, cross-checks the captured amount against the
   * gateway, allocates the order reference, decrements stock atomically and
   * persists the order. A confirmation is rendered ONLY from its response —
   * never from a client timer (the previous revision's fabricated
   * "Order Confirmed" setTimeout is gone).
   */
  const verifyAndConfirm = useCallback(
    async (rzp: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      setPaymentStage('Verifying payment…');
      try {
        const res = await fetch(apiUrl('verify-razorpay-payment'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: rzp.razorpay_order_id,
            razorpay_payment_id: rzp.razorpay_payment_id,
            razorpay_signature: rzp.razorpay_signature,
            items: items.map((i) => ({ id: i.product.id, qty: i.quantity })),
            shippingAddress,
            couponCode: appliedCoupon || undefined,
          }),
        });
        const data = await readJsonResponse<VerifyResponse>(res, 'verify-razorpay-payment');
        if (!res.ok || !data.success) {
          setCheckoutError(
            data.error ||
              'Your payment could not be verified. Do not pay again. Please contact support with the payment reference ' +
              rzp.razorpay_payment_id +
              ' so we can reconcile the payment safely.',
          );
          setIsProcessing(false);
          setPaymentStage(null);
          return;
        }
        setOrderComplete({
          orderId: data.orderId,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          total: Number(data.total) || 0,
          email: formData.email,
        });
        clearCart();
        setIsProcessing(false);
        setPaymentStage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        setCheckoutError(
          e instanceof Error
            ? e.message
            : 'Payment verification failed. Please contact support before retrying — do not pay again.',
        );
        setIsProcessing(false);
        setPaymentStage(null);
      }
    },
    [items, appliedCoupon, formData.email, clearCart],
  );

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setIsProcessing(true);

    if (items.length === 0) {
      setCheckoutError('Your cart is empty.');
      setIsProcessing(false);
      return;
    }

    try {
      // Refresh server pricing immediately before payment so the amount the
      // gateway is asked for cannot drift from the catalogue.
      await refreshPricing();

      setPaymentStage('Creating secure order…');
      const res = await fetch(apiUrl('create-razorpay-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.product.id, qty: i.quantity })),
          couponCode: appliedCoupon || undefined,
          userEmail: formData.email,
          userPhone: formData.phone,
        }),
      });
      const data = await readJsonResponse<CreateOrderResponse>(res, 'create-razorpay-order');
      if (!res.ok || !data.razorpayOrderId || !data.keyId) {
        setCheckoutError(data.error || 'Could not start the payment. Please try again.');
        setIsProcessing(false);
        setPaymentStage(null);
        return;
      }

      setPaymentStage('Opening secure payment window…');
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setCheckoutError(
          'Could not load the payment gateway. Disable content blockers or try another browser, then retry.',
        );
        setIsProcessing(false);
        setPaymentStage(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount ?? 0,
        currency: data.currency || 'INR',
        name: 'Jass Products',
        description: 'Ayurvedic order payment',
        order_id: data.razorpayOrderId,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#8b6d43' },
        handler: (response) => {
          void verifyAndConfirm(response);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStage(null);
            setCheckoutError('Payment window was closed before completion. Your order has NOT been placed — you can retry safely.');
          },
        },
      });
      rzp.open();
      // Note: isProcessing stays true while the modal is open and through the
      // verify call; it is cleared in every terminal branch above.
    } catch (e) {
      // A failed gateway request must never manufacture an order in production. The cart
      // remains intact so the customer can retry after the payment service recovers.
      setCheckoutError(
        e instanceof Error
          ? e.message
          : 'Could not start checkout. Please try again in a moment.',
      );
      setIsProcessing(false);
      setPaymentStage(null);
    }
  };

  // Order Confirmation View — reached ONLY after the server verified the
  // payment signature and persisted the order (orderId is server-allocated).
  if (orderComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-md border border-emerald-200">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8b6d43] mb-2">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 mb-3">
          Your Daily Ritual is on the Way
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mb-8 leading-relaxed">
          Thank you for choosing JASS Products. Your remedies are being hand-packaged in our apothecary under strict Ayurvedic protocol.
        </p>

        <div className="w-full bg-[#fbfbf9] rounded-3xl border border-[#d2c2ad]/50 p-6 sm:p-8 text-left mb-8 shadow-xs space-y-4 text-xs">
          <div className="flex justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Order Reference</span>
            <span className="font-mono font-bold text-neutral-900 text-sm">
              {orderComplete.orderId}
            </span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Order Date</span>
            <span className="font-medium text-neutral-800">{orderComplete.date}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Confirmation Sent To</span>
            <span className="font-medium text-neutral-800">{orderComplete.email}</span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-sm">
            <span className="text-neutral-900">Total Paid</span>
            <span className="text-[#8b6d43] font-serif text-base">
              {formatINR(orderComplete.total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigate(`track-order?id=${orderComplete.orderId}`)}
            className="px-8 py-3.5 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold tracking-widest uppercase transition-all shadow-md cursor-pointer"
          >
            Track This Order
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-8 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <Package className="w-16 h-16 text-[#8b6d43]/50 mb-4" />
        <h2 className="font-serif text-2xl text-neutral-900 mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-neutral-500 max-w-sm mb-6">
          Add Ayurvedic remedies to your cart before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('categories')}
          className="px-6 py-3 rounded-full bg-[#8b6d43] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          Explore Apothecary
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-xs text-neutral-500">
        <button
          type="button"
          onClick={() => onNavigate('categories')}
          className="hover:text-neutral-800 flex items-center gap-1 font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
        <span>/</span>
        <span className="text-neutral-900 font-bold uppercase tracking-wider">Secure Checkout</span>
      </div>

      {checkoutError && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-xs text-red-800 max-w-3xl mx-auto">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form: Customer & Shipping (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact Details */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#d2c2ad]/40 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-neutral-900 tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8b6d43]/15 text-[#8b6d43] text-xs flex items-center justify-center font-mono">1</span>
              <span>Contact Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                />
              </div>
              <div>
                <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#d2c2ad]/40 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-neutral-900 tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8b6d43]/15 text-[#8b6d43] text-xs flex items-center justify-center font-mono">2</span>
              <span>Delivery Address</span>
            </h2>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                  Street Address & House / Apt No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Botanical Sanctuary, Green Avenue"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 uppercase font-semibold tracking-wider mb-1">
                    PIN / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="560001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#FAF9F6] focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#d2c2ad]/40 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-neutral-900 tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8b6d43]/15 text-[#8b6d43] text-xs flex items-center justify-center font-mono">3</span>
              <span>Payment Option</span>
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border-2 border-[#8b6d43] bg-[#8b6d43]/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-[#8b6d43] bg-white flex-shrink-0" />
                  <div>
                    <span className="font-bold text-neutral-900 uppercase block text-xs sm:text-sm">
                      Razorpay Verified Checkout (UPI, Cards, NetBanking)
                    </span>
                    <span className="text-neutral-500 text-[11px] block mt-0.5">
                      256-bit encrypted bank-grade authentication • Instant Dispatch
                    </span>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-[#8b6d43] flex-shrink-0" />
              </div>

              <div className="p-3.5 bg-neutral-100/70 border border-[#d2c2ad]/40 rounded-xl flex items-start gap-2.5 text-[11px] text-neutral-600 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#8b6d43] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Prepaid Policy:</strong> To protect fresh, small-batch botanical formulations and prevent automated bot order flooding, Cash on Delivery (COD) is strictly disabled.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 p-6 sm:p-8 bg-[#fbfbf9] rounded-3xl border border-[#d2c2ad]/60 shadow-md space-y-6">
            <h3 className="font-serif text-xl font-bold text-neutral-900 tracking-wide uppercase pb-4 border-b border-neutral-200">
              Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>

            {/* Items List — server-revalidated availability shown per item */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {items.map(({ product, quantity }) => (
                <div key={String(product.id)} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-[#d2c2ad]/40 p-1 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-darken"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs font-bold text-neutral-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Qty: {quantity} × {formatINR(product.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-neutral-900">
                    {formatINR(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Applied coupon badge */}
            {appliedCoupon && discountAmount > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-bold">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Promo {appliedCoupon}
                </span>
                <span className="font-bold">−{formatINR(discountAmount)}</span>
              </div>
            )}

            {/* Cost Breakdown — ALL figures are the server's (revalidate-cart) */}
            <div className="space-y-2 text-xs text-neutral-600 pt-4 border-t border-neutral-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Savings</span>
                  <span>−{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatINR(shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-neutral-300">
                <span>Total Due</span>
                <span className="text-[#8b6d43] font-serif text-xl">
                  {formatINR(total)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isProcessing || pricingLoading || total <= 0}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#8b6d43] to-[#a68252] hover:from-[#a68252] hover:to-[#8b6d43] text-white text-xs font-bold tracking-[0.2em] uppercase shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {paymentStage
                  ? paymentStage
                  : isProcessing
                    ? 'Processing…'
                    : `Pay Securely • ${formatINR(total)}`}
              </span>
            </button>

            {pricingError && (
              <p className="text-[11px] text-red-700 text-center">{pricingError}</p>
            )}

            <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 uppercase tracking-widest font-semibold pt-2">
              <ShieldCheck className="w-4 h-4 text-[#8b6d43]" />
              <span>Payments verified server-side before any order is created</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
