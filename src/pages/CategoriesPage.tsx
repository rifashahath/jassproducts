import React, { useState, useEffect, useRef } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { Product, fetchLiveProducts, products as defaultProducts } from '../lib/products';
import { useCart } from '../context/CartContext';
import { gsap, useGSAP } from '../lib/gsap';

function toInr(usdPrice: number): { price: number; mrp: number; priceStr: string; mrpStr: string } {
  const price = Math.round(Math.round(usdPrice * 18) / 50) * 50 - 1;
  const mrp = Math.round(Math.round(price * 1.25) / 50) * 50 - 1;
  return {
    price,
    mrp,
    priceStr: `₹${price.toLocaleString('en-IN')}`,
    mrpStr: `₹${mrp.toLocaleString('en-IN')}`,
  };
}

interface CategoriesPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  initialCategory?: string;
}

const categories = [
  'All',
  'Hair Care',
  'Skin Renewal',
  'Health Care',
  'Soap & Bath',
  'Face Nourish',
  'Body Care',
  'Aromatherapy',
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate, initialCategory }) => {
  const { addToCart } = useCart();
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);
  const [addedId, setAddedId] = useState<string | number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const catContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'All');
  }, [initialCategory]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const liveItems = await fetchLiveProducts();
        if (isMounted && liveItems.length > 0) {
          setProductsList(liveItems);
        }
      } catch (err) {
        console.warn('Using default products:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts =
    selectedCategory.toLowerCase() === 'all'
      ? productsList
      : productsList.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const sCat = selectedCategory.toLowerCase();
          return pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);
        });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  useGSAP(
    () => {
      gsap.fromTo(
        '.gsap-cat-header',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-cat-card',
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.06,
          ease: 'power2.out',
        }
      );
    },
    { scope: catContainerRef, dependencies: [selectedCategory, filteredProducts.length] }
  );

  return (
    <div ref={catContainerRef} className="w-full flex flex-col items-center min-h-screen bg-[#f4f1ea] py-12 px-4 sm:px-6 md:px-12 selection:bg-[#8b6d43]/20">
      {/* Clean Minimalist Header */}
      <div className="gsap-cat-header w-full max-w-[1240px] mx-auto text-center mb-10 md:mb-14">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-2.5 tracking-wider uppercase font-semibold">
          Our Products
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto tracking-wide leading-relaxed font-light mb-8">
          Ayurvedic formulas for hair, skin, and body — cold-pressed, single-origin ingredients.
        </p>

        {/* Category Navigation Bar */}
        <div className="inline-flex items-center justify-center flex-wrap gap-1.5 bg-[#ede6dc]/70 p-1.5 rounded-full border border-[#d2c2ad]/80 shadow-2xs max-w-3xl mx-auto">
          {categories.map((cat) => {
            const isActive =
              selectedCategory.toLowerCase() === cat.toLowerCase() ||
              (selectedCategory.toLowerCase() !== 'all' &&
                cat.toLowerCase() !== 'all' &&
                (selectedCategory.toLowerCase().includes(cat.toLowerCase()) ||
                  cat.toLowerCase().includes(selectedCategory.toLowerCase())));
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat === 'All') {
                    window.history.replaceState(null, '', '#categories');
                  } else {
                    window.history.replaceState(null, '', `#categories?category=${encodeURIComponent(cat)}`);
                  }
                }}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apothecary Product Grid matching exact reference design */}
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-16 justify-items-center items-stretch">
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <p className="text-sm text-neutral-500 mb-4">No botanical remedies found in this category.</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              View All Formulations
            </button>
          </div>
        )}
        {filteredProducts.map((product) => {
          const isAdded = addedId === product.id;
          const displayImg = product.image3D || product.image;
          const priceData = toInr(product.price);

          return (
            <div
              key={String(product.id)}
              className="gsap-cat-card group flex flex-col bg-[#fbfbf8] border border-[#d2c2ad] rounded-[1.75rem] p-4 sm:p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative w-full"
            >
              {product.badge && (
                <span className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[9px] font-bold tracking-widest uppercase shadow-sm">
                  {product.badge}
                </span>
              )}
              <div
                onClick={() => onNavigate('product', { id: String(product.id) })}
                className="w-full aspect-square rounded-2xl overflow-hidden bg-[#f4efe6] mb-4 relative flex items-center justify-center p-5 cursor-pointer"
              >
                <img
                  src={displayImg}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-darken group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col flex-1 justify-between text-left">
                <div className="mb-3">
                  <span className="text-[9px] font-mono tracking-[0.16em] uppercase text-neutral-400 block mb-0.5">
                    Cold-Pressed Formulation
                  </span>
                  <h3
                    onClick={() => onNavigate('product', { id: String(product.id) })}
                    className="text-neutral-900 text-base font-serif font-bold tracking-wide uppercase mb-1 line-clamp-1 hover:text-[#8b6d43] transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between my-2 pt-2 border-t border-neutral-200/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-serif font-bold text-[#8b6d43]">
                        {priceData.priceStr}
                      </span>
                      <span className="text-xs text-neutral-400 line-through font-mono">
                        {priceData.mrpStr}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                      {product.inStock !== false ? 'In stock' : 'Low stock'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, product)}
                  className={`w-full py-2.5 sm:py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                    isAdded
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-[#8b6d43] hover:bg-[#735835]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Bag</span>
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
          );
        })}
      </div>
    </div>
  );
};
