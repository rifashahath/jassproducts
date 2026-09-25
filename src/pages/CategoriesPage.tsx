import React, { useState, useEffect, useRef } from 'react';
import { Product, fetchLiveProducts, products as defaultProducts } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { gsap, useGSAP } from '../lib/gsap';

interface CategoriesPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  initialCategory?: string;
}

const categories = [
  'All',
  'Health Care',
  'Hair Care',
  'Skincare & Creams',
  'Lip Care',
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate, initialCategory }) => {
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const catContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'All');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
    <div ref={catContainerRef} className="w-full flex flex-col items-center min-h-screen bg-[#f4f1ea] py-12 md:py-16 px-4 sm:px-6 md:px-12 selection:bg-[#8b6d43]/20">
      {/* Clean Editorial Header */}
      <div className="gsap-cat-header w-full max-w-[1240px] mx-auto text-center mb-10 md:mb-14">
        <span className="text-[11px] font-mono tracking-[0.24em] uppercase text-[#8b6d43] font-semibold block mb-2.5">
          Botanical Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-3 tracking-wide font-normal">
          The Apothecary Shelf
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto tracking-wide leading-relaxed font-light mb-8">
          Cold-pressed Ayurvedic formulations and single-origin botanical remedies for hair, skin, and daily vitality.
        </p>

        {/* Category Navigation Bar */}
        <div className="inline-flex items-center justify-center flex-wrap gap-1.5 bg-[#ede6dc]/80 p-1.5 rounded-full border border-[#d2c2ad]/70 shadow-2xs max-w-3xl mx-auto">
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
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apothecary Product Grid */}
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-16 items-stretch">
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
        {filteredProducts.map((product) => (
          <ProductCard
            key={String(product.id)}
            product={product}
            onNavigate={onNavigate}
            className="gsap-cat-card w-full"
          />
        ))}
      </div>
    </div>
  );
};
