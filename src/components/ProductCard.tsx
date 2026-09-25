import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Product } from '../lib/products';
import { useCart } from '../context/CartContext';

function toInr(rawPrice: number) {
  const inr = Math.round(rawPrice);
  const mrp = Math.round(inr * 1.25);
  const discount = Math.round(((mrp - inr) / mrp) * 100);
  return {
    price: inr,
    mrp,
    discount,
    priceStr: `₹${inr.toLocaleString('en-IN')}`,
    mrpStr: `₹${mrp.toLocaleString('en-IN')}`,
  };
}

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  className = '',
}) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const priceData = toInr(product.price);

  const hoverImg =
    product.hoverImage ||
    (product.gallery && product.gallery.length > 1 ? product.gallery[1] : null);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleCardClick = () => {
    onNavigate('product', { id: String(product.id) });
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-[#fcfbf9] hover:bg-white border border-[#e8e2d8] hover:border-[#8b6d43]/40 rounded-2xl p-4 sm:p-5 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(75,54,33,0.1)] cursor-pointer text-left ${className}`}
    >
      {/* Product Image Canvas */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#f5f1ea]/80 mb-4 flex items-center justify-center p-5 group-hover:bg-[#f2ece2] transition-colors duration-500">
        {/* Subtle pill for volume or specialty */}
        {product.volume && (
          <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-xs text-[10px] font-mono tracking-wider text-neutral-600 border border-neutral-200/60 shadow-2xs">
            {product.volume}
          </span>
        )}

        {/* Primary Image */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain mix-blend-darken transition-all duration-700 ease-out group-hover:scale-105 drop-shadow-xs ${
            hoverImg ? 'group-hover:opacity-0' : ''
          }`}
        />

        {/* Secondary Hover Image (smooth crossfade) */}
        {hoverImg && (
          <img
            src={hoverImg}
            alt={`${product.name} alternate view`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-5 mix-blend-darken opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105 drop-shadow-xs"
          />
        )}
      </div>

      {/* Card Content & Hierarchy */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Badge row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-400 font-medium truncate">
              {product.category}
            </span>
            {product.badge && (
              <span className="text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] whitespace-nowrap">
                {product.badge}
              </span>
            )}
          </div>

          {/* Full Product Title */}
          <h3 className="font-serif text-[17px] sm:text-[18px] text-neutral-900 font-medium leading-snug line-clamp-2 min-h-[2.8rem] group-hover:text-[#8b6d43] transition-colors mb-2">
            {product.name}
          </h3>
        </div>

        {/* Price & Always-Visible Add to Bag Button */}
        <div className="pt-3 border-t border-[#e8e2d8]/70 flex items-center justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-semibold text-neutral-900">
              {priceData.priceStr}
            </span>
            {priceData.mrp > priceData.price && (
              <span className="text-xs text-neutral-400 line-through font-mono">
                {priceData.mrpStr}
              </span>
            )}
          </div>

          {/* Prominent, Always-Visible Add to Bag Button on all screens */}
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Add ${product.name} to bag`}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              isAdded
                ? 'bg-emerald-800 text-white'
                : 'bg-[#8b6d43] hover:bg-[#725732] text-white hover:shadow-md'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
