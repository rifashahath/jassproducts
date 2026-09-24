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

      {/* Main Cart Modal Card - Full Width without Sidebar */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[660px] bg-white text-neutral-900 rounded-2xl md:rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 border border-neutral-800/80">
        
        {/* ========================================================================= */}
        {/* 1. MAIN SHOPPING CART SECTION (Fills full main space)                     */}
        {/* ========================================================================= */}

        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 bg-white overflow-hidden">
          {/* Top Back Link & Mobile Close Trigger */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Back to store</span>
            </button>

            {/* Mobile close button (visible only below md) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="md:hidden p-1 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Heading: Shopping cart + Items counter */}
          <div className="flex items-baseline justify-between mt-3 mb-6">
            <h2 className="font-sans font-light text-2xl sm:text-3xl lg:text-4xl text-neutral-900 tracking-tight">
              Shopping cart
            </h2>
            <span className="text-[11px] sm:text-xs font-medium tracking-widest text-neutral-400 uppercase font-sans">
              {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          {/* Column Header Titles */}
          <div className="grid grid-cols-12 gap-3 text-[11px] font-normal tracking-wide text-neutral-400 pb-2.5 border-b border-neutral-100">
            <div className="col-span-6 sm:col-span-5">Item</div>
            <div className="col-span-2 text-center">Size</div>
            <div className="col-span-2 sm:col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right pr-2">Price</div>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                  <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h3 className="font-sans font-normal text-base tracking-normal text-neutral-800 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-5">
                  Explore our pure botanical formulas for hair, skin, and wellness.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('categories');
                  }}
                  className="px-6 py-2.5 bg-[#353638] hover:bg-neutral-900 text-white text-[11px] font-medium tracking-widest uppercase transition-colors cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={String(product.id)}
                  className="grid grid-cols-12 gap-3 items-center py-5 group"
                >
                  {/* Floating Product Image & Title */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className="w-14 h-16 sm:w-18 sm:h-20 flex items-center justify-center flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs"
                      />
                    </div>
                    <div className="min-w-0 pr-1">
                      <h4 className="font-sans font-normal text-sm sm:text-base text-neutral-900 tracking-normal line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-widest font-medium mt-0.5">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-2 text-center text-xs sm:text-sm text-neutral-600 font-normal">
                    {product.volume || '100 ml'}
                  </div>

                  {/* Quantity Stepper (Delicate circular outline buttons) */}
                  <div className="col-span-2 sm:col-span-3 flex items-center justify-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-neutral-300 text-neutral-400 hover:text-neutral-900 hover:border-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5 stroke-[1.75]" />
                    </button>
                    <span className="text-xs sm:text-sm font-normal text-neutral-900 min-w-[18px] text-center select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-neutral-300 text-neutral-400 hover:text-neutral-900 hover:border-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5 stroke-[1.75]" />
                    </button>
                  </div>

                  {/* Price & Remove (Thin Cross) */}
                  <div className="col-span-2 flex items-center justify-end gap-2 sm:gap-4 pr-1">
                    <span className="text-xs sm:text-sm font-normal text-neutral-900 tracking-tight">
                      {formatINR(product.price * quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Left Note */}
          <div className="pt-3 text-[11px] text-neutral-400 font-normal">
            Free shipping on prepaid orders above ₹5,000
          </div>
        </div>


        {/* ========================================================================= */}
        {/* 2. SUMMARY PANEL (Right side)                                             */}
        {/* ========================================================================= */}

        <div className="w-full md:w-80 lg:w-96 bg-[#f7f7f7] border-t md:border-t-0 md:border-l border-neutral-200/60 p-6 sm:p-8 lg:p-10 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Desktop Top Close Button */}
            <div className="hidden md:flex justify-end -mt-2 -mr-2 mb-2">
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            {/* Summary Title */}
            <h3 className="font-sans font-normal text-base sm:text-lg text-neutral-900 mb-6">
              Summary
            </h3>

            {pricingError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {pricingError}
              </div>
            )}

            {/* Breakdown — all figures come from the server revalidation */}
            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-600 font-normal">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-medium">{formatINR(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="text-neutral-900 font-medium">
                  {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>GST (18%)</span>
                <span className="text-neutral-900 font-medium">{formatINR(gstAmount)}</span>
              </div>
            </div>
          </div>

          {/* Total & Checkout Action */}
          <div className="pt-6">
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-xs sm:text-sm font-normal text-neutral-900">
                Total
              </span>
              <span className="text-sm sm:text-base font-semibold text-neutral-900 font-sans">
                {formatINR(total)}
              </span>
            </div>

            <button
              type="button"
              disabled={items.length === 0 || pricingLoading || total <= 0}
              onClick={handleCheckout}
              className={`w-full py-3.5 sm:py-4 text-white text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors text-center cursor-pointer ${
                items.length === 0 || pricingLoading || total <= 0
                  ? 'bg-neutral-300 cursor-not-allowed'
                  : 'bg-[#353638] hover:bg-[#202123]'
              }`}
            >
              {pricingLoading ? 'Updating prices…' : 'Checkout'}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};
