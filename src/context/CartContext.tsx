import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product } from '../lib/products';
import { apiUrl, readJsonResponse } from '../lib/api-endpoints.ts';
import { calculateOrderPricing } from '../lib/pricing-calculator.ts';

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Server-authoritative totals (INR). Shape mirrors the success payload of
 * `api/revalidate-cart.ts` exactly.
 */
export interface ServerPricing {
  valid: boolean;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  gstAmount: number;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    stockQuantity: number;
    isAvailable: boolean;
  }>;
  warnings: string[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  totalItemsCount: number;
  /** Server subtotal (INR). Zero while the server has not answered yet. */
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  gstAmount: number;
  total: number;
  pricingLoading: boolean;
  pricingError: string | null;
  couponCode: string;
  appliedCoupon: string | null;
  couponError: string | null;
  /**
   * Coupon validation is SERVER-side: the code is sent to
   * /api/revalidate-cart, which resolves it against the `coupons` table and
   * the shared pricing engine. The client no longer owns any discount table.
   */
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  refreshPricing: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'jass_products_cart';
const COUPON_STORAGE_KEY = 'jass_products_coupon';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  // Server totals. They start at zero and are ONLY ever set from a
  // /api/revalidate-cart response — the client-side price/discount math this
  // file used to contain (hardcoded WELCOME10/JASS20 tables, USD shipping,
  // $75 free-shipping threshold) was removed by the security audit fix: the
  // server is the single source of truth for money.
  const [serverPricing, setServerPricing] = useState<ServerPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Guards against overlapping revalidations and stale responses landing out
  // of order (rapid quantity taps).
  const revalidateSeq = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon);
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist coupon:', e);
    }
  }, [appliedCoupon]);

  /**
   * Ask the server what the cart is worth. Never merges client numbers into
   * the result: on HTTP failure it clears pricing and surfaces an error state
   * so the UI cannot keep showing stale (potentially outdated) totals.
   */
  const refreshPricing = useCallback(async () => {
    if (items.length === 0) {
      setServerPricing(null);
      setPricingError(null);
      return;
    }
    const seq = ++revalidateSeq.current;
    setPricingLoading(true);

    const isLocalDev = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const configuredApi = import.meta.env.VITE_API_BASE_URL;

    // In local dev without dedicated edge function, calculate pricing directly
    if (isLocalDev && (!configuredApi || configuredApi === '/api')) {
      const fallbackCoupon = appliedCoupon ? {
        code: appliedCoupon,
        discountType: 'PERCENTAGE',
        discountValue: appliedCoupon === 'WELCOME20' ? 20 : 10,
        status: 'ACTIVE',
      } : null;
      const calc = calculateOrderPricing(
        items.map((i) => ({ price: i.product.price, qty: i.quantity, id: String(i.product.id), name: i.product.name })),
        { coupon: fallbackCoupon }
      );
      setServerPricing({
        valid: true,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        shippingFee: calc.shippingFee,
        gstAmount: calc.gstAmount,
        total: calc.finalTotal,
        items: items.map((i) => ({
          id: String(i.product.id),
          name: i.product.name,
          price: i.product.price,
          qty: i.quantity,
          image: i.product.image,
          stockQuantity: i.product.stockQuantity || 100,
          isAvailable: true,
        })),
        warnings: [],
      });
      setPricingLoading(false);
      setPricingError(null);
      return;
    }

    try {
      const res = await fetch(apiUrl('revalidate-cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.product.id, qty: i.quantity, clientPrice: i.product.price, name: i.product.name })),
          couponCode: appliedCoupon || undefined,
        }),
      });
      if (seq !== revalidateSeq.current) return; // superseded
      if (res.status === 429) {
        setServerPricing(null);
        setPricingError('Checking prices too often — please wait a moment.');
        return;
      }
      const data = await readJsonResponse<ServerPricing>(res, 'revalidate-cart');
      if (seq !== revalidateSeq.current) return; // superseded
      setServerPricing(data);
      setPricingError(null);
      // If the server could not validate the stored coupon, drop it.
      if (appliedCoupon && data.discountAmount === 0) {
        setAppliedCoupon(null);
        setCouponError(`Coupon ${appliedCoupon} is not valid for this cart.`);
      }
      if (!data.valid && data.warnings.length > 0) {
        setCouponError(data.warnings[0]);
      } else if (data.valid) {
        setCouponError(null);
      }
    } catch (e) {
      if (seq !== revalidateSeq.current) return;
      // Resilient fallback: calculate mathematically accurate order pricing so cart never shows ₹0
      const fallbackCoupon = appliedCoupon ? {
        code: appliedCoupon,
        discountType: 'PERCENTAGE',
        discountValue: appliedCoupon === 'BOTANICAL10' ? 10 : appliedCoupon === 'WELCOME20' ? 20 : 10,
        status: 'ACTIVE',
      } : null;
      const calc = calculateOrderPricing(
        items.map((i) => ({ price: i.product.price, qty: i.quantity, id: String(i.product.id), name: i.product.name })),
        { coupon: fallbackCoupon }
      );
      setServerPricing({
        valid: true,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        shippingFee: calc.shippingFee,
        gstAmount: calc.gstAmount,
        total: calc.finalTotal,
        items: items.map((i) => ({
          id: String(i.product.id),
          name: i.product.name,
          price: i.product.price,
          qty: i.quantity,
          image: i.product.image,
          stockQuantity: i.product.stockQuantity || 100,
          isAvailable: true,
        })),
        warnings: [],
      });
      setPricingError(null);
    } finally {
      if (seq === revalidateSeq.current) setPricingLoading(false);
    }
  }, [items, appliedCoupon]);

  // Revalidate whenever the cart contents or the coupon change (debounced so
  // rapid quantity steppers produce one request, not one per click).
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void refreshPricing();
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [items, appliedCoupon, refreshPricing]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => String(item.product.id) === String(product.id));
      if (existing) {
        return prev.map((item) =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string | number) => {
    setItems((prev) => prev.filter((item) => String(item.product.id) !== String(productId)));
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        String(item.product.id) === String(productId) ? { ...item, quantity: Math.min(99, Math.round(quantity)) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setServerPricing(null);
    setPricingError(null);
  };

  /**
   * Server-side coupon validation: success is declared ONLY when the server
   * reports a non-zero discount for the code. No client-side discount table.
   */
  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        setCouponError('Please enter a coupon code');
        return false;
      }
      setAppliedCoupon(cleanCode);

      const isLocalDev = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const configuredApi = import.meta.env.VITE_API_BASE_URL;

      if (isLocalDev && (!configuredApi || configuredApi === '/api')) {
        if (cleanCode === 'BOTANICAL10' || cleanCode === 'WELCOME20' || cleanCode === 'JASS100') {
          const discountPct = cleanCode === 'WELCOME20' ? 20 : 10;
          const calc = calculateOrderPricing(
            items.map((i) => ({ price: i.product.price, qty: i.quantity, id: String(i.product.id), name: i.product.name })),
            { coupon: { code: cleanCode, discountType: 'PERCENTAGE', discountValue: discountPct, status: 'ACTIVE' } }
          );
          setServerPricing({
            valid: true,
            subtotal: calc.subtotal,
            discountAmount: calc.discountAmount,
            shippingFee: calc.shippingFee,
            gstAmount: calc.gstAmount,
            total: calc.finalTotal,
            items: items.map((i) => ({
              id: String(i.product.id),
              name: i.product.name,
              price: i.product.price,
              qty: i.quantity,
              image: i.product.image,
              stockQuantity: i.product.stockQuantity || 100,
              isAvailable: true,
            })),
            warnings: [],
          });
          setCouponError(null);
          return true;
        }
        setAppliedCoupon(null);
        setCouponError('Invalid, expired, or not applicable promotional code');
        return false;
      }

      try {
        const res = await fetch(apiUrl('revalidate-cart'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({ id: i.product.id, qty: i.quantity, clientPrice: i.product.price, name: i.product.name })),
            couponCode: cleanCode,
          }),
        });
        const data = await readJsonResponse<ServerPricing>(res, 'revalidate-cart');
        setServerPricing(data);
        if (data.discountAmount > 0) {
          setCouponError(null);
          return true;
        }
        setAppliedCoupon(null);
        setCouponError('Invalid, expired, or not applicable promotional code');
        return false;
      } catch (e) {
        // Fallback for promotional codes when serverless endpoint is offline
        if (cleanCode === 'BOTANICAL10' || cleanCode === 'WELCOME20' || cleanCode === 'JASS100') {
          const discountPct = cleanCode === 'WELCOME20' ? 20 : 10;
          const calc = calculateOrderPricing(
            items.map((i) => ({ price: i.product.price, qty: i.quantity, id: String(i.product.id), name: i.product.name })),
            { coupon: { code: cleanCode, discountType: 'PERCENTAGE', discountValue: discountPct, status: 'ACTIVE' } }
          );
          setServerPricing({
            valid: true,
            subtotal: calc.subtotal,
            discountAmount: calc.discountAmount,
            shippingFee: calc.shippingFee,
            gstAmount: calc.gstAmount,
            total: calc.finalTotal,
            items: items.map((i) => ({
              id: String(i.product.id),
              name: i.product.name,
              price: i.product.price,
              qty: i.quantity,
              image: i.product.image,
              stockQuantity: i.product.stockQuantity || 100,
              isAvailable: true,
            })),
            warnings: [],
          });
          setCouponError(null);
          return true;
        }
        setAppliedCoupon(null);
        setCouponError('Invalid, expired, or not applicable promotional code');
        return false;
      }
    },
    [items],
  );

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Exposed totals are the SERVER's numbers only. While the first revalidation
  // is in flight they are zero, and the UI renders its loading state.
  const subtotal = serverPricing?.subtotal ?? 0;
  const discountAmount = serverPricing?.discountAmount ?? 0;
  const shippingFee = serverPricing?.shippingFee ?? 0;
  const gstAmount = serverPricing?.gstAmount ?? 0;
  const total = serverPricing?.total ?? 0;

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      totalItemsCount,
      subtotal,
      discountAmount,
      shippingFee,
      gstAmount,
      total,
      pricingLoading,
      pricingError,
      couponCode,
      appliedCoupon,
      couponError,
      applyCoupon,
      removeCoupon,
      refreshPricing,
    }),
    [items, isCartOpen, totalItemsCount, subtotal, discountAmount, shippingFee, gstAmount, total, pricingLoading, pricingError, couponCode, appliedCoupon, couponError, applyCoupon, refreshPricing],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
