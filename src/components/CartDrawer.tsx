import React from 'react';
import { X, Plus, Minus, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../lib/format.ts';

interface CartDrawerProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    gstAmount,
    total,
    pricingLoading,
    pricingError,
  } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    onNavigate('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 md:p-8 lg:p-12 animate-in fade-in duration-200">
      {/* Dark Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/65 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Main Cart Modal Card */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[660px] bg-white text-neutral-900 rounded-2xl md:rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 border border-neutral-200">
        
        {/* ========================================================================= */}
        {/* 1. MAIN SHOPPING CART SECTION                                            */}
        {/* ========================================================================= */}

        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 bg-white overflow-hidden">
          {/* Top Back Link & Mobile Close Trigger */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="text-xs font-semibold tracking-[0.16em] uppercase text-neutral-700 hover:text-neutral-950 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
              <span>Back to store</span>
            </button>

            {/* Mobile close button (visible only below md) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="md:hidden w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Heading: Shopping cart + Items counter */}
          <div className="flex items-baseline justify-between mt-3 mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-neutral-900 font-medium tracking-tight">
              Shopping cart
            </h2>
            <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase font-mono">
              {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          {/* Column Header Titles */}
          <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 pb-2.5 border-b border-neutral-100">
            <div className="col-span-6 sm:col-span-5">Item</div>
            <div className="col-span-2 text-center">Size</div>
            <div className="col-span-2 sm:col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right pr-2">Price</div>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-lg text-neutral-800 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-5">
                  Explore our pure botanical formulas for hair, skin, and wellness.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('categories');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#8b6d43] hover:bg-[#725732] text-white text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={String(product.id)}
                  className="grid grid-cols-12 gap-3 items-center py-4 group"
                >
                  {/* Product Image & Title */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#f5f1ea]/80 p-2 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/products/amla-powder/main.png';
                        }}
                        className="w-full h-full object-contain mix-blend-darken drop-shadow-xs"
                      />
                    </div>
                    <div className="min-w-0 pr-1">
                      <h4 className="font-serif font-medium text-sm sm:text-base text-neutral-900 tracking-normal line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-widest font-mono mt-0.5">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-2 text-center text-xs sm:text-sm text-neutral-600 font-mono">
                    {product.volume || '100 G'}
                  </div>

                  {/* Quantity Stepper (Clear, visible circular buttons) */}
                  <div className="col-span-2 sm:col-span-3 flex items-center justify-center gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:border-neutral-900 flex items-center justify-center transition-all cursor-pointer font-bold active:scale-95 shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900 min-w-[20px] text-center select-none font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:border-neutral-900 flex items-center justify-center transition-all cursor-pointer font-bold active:scale-95 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Price & Remove Button */}
                  <div className="col-span-2 flex items-center justify-end gap-2 sm:gap-3 pr-1">
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900 tracking-tight font-mono">
                      {formatINR(product.price * quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name}`}
                      title="Remove item"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Left Note */}
          <div className="pt-3 text-[11px] text-neutral-500 font-medium">
            Free shipping on prepaid orders above ₹5,000
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUMMARY PANEL (Right side)                                             */}
        {/* ========================================================================= */}

        <div className="w-full md:w-80 lg:w-96 bg-[#f7f5ef] border-t md:border-t-0 md:border-l border-neutral-200 p-6 sm:p-8 lg:p-10 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Desktop Top Close Button */}
            <div className="hidden md:flex justify-end -mt-2 -mr-2 mb-2">
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-neutral-200/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Summary Title */}
            <h3 className="font-serif text-lg text-neutral-900 mb-6 font-medium">
              Order Summary
            </h3>

            {pricingError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {pricingError}
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-600 font-normal">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-semibold font-mono">{formatINR(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="text-neutral-900 font-semibold font-mono">
                  {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>GST (18%)</span>
                <span className="text-neutral-900 font-semibold font-mono">{formatINR(gstAmount)}</span>
              </div>
            </div>
          </div>

          {/* Total & Checkout Action */}
          <div className="pt-6">
            <div className="flex justify-between items-baseline mb-6 border-t border-neutral-200 pt-4">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Total
              </span>
              <span className="text-lg sm:text-xl font-bold text-neutral-900 font-mono">
                {formatINR(total)}
              </span>
            </div>

            {/* Prominent Checkout Button */}
            <button
              type="button"
              disabled={items.length === 0 || pricingLoading || total <= 0}
              onClick={handleCheckout}
              className={`w-full py-4 rounded-xl text-white text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-md hover:shadow-lg text-center cursor-pointer ${
                items.length === 0 || pricingLoading || total <= 0
                  ? 'bg-neutral-300 cursor-not-allowed'
                  : 'bg-[#8b6d43] hover:bg-[#725732] active:scale-[0.99]'
              }`}
            >
              {pricingLoading ? 'Updating prices...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
