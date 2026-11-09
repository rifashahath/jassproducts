import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, Sparkles, Filter } from 'lucide-react';
import { Product, fetchLiveProducts, products as defaultProducts } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { gsap, useGSAP } from '../lib/gsap';

interface CategoriesPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  initialCategory?: string;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate, initialCategory }) => {
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const catContainerRef = useRef<HTMLDivElement>(null);

  const availableCategories = useMemo(() => {
    const list = ['All', 'Lip Care', 'Face & Skin Care', 'Hair Care', 'Herbal Soaps', 'Herbal Powders'];
    productsList.forEach((p) => {
      if (p.category) {
        const normalized = p.category
          .toLowerCase()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (!list.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
          list.push(normalized);
        }
      }
    });
    return list;
  }, [productsList]);

  // Compute live count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: productsList.length };
    availableCategories.forEach((cat) => {
      if (cat === 'All') return;
      const count = productsList.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const cCat = cat.toLowerCase();
        return pCat === cCat || pCat.includes(cCat) || cCat.includes(pCat);
      }).length;
      counts[cat] = count;
    });
    return counts;
  }, [productsList, availableCategories]);

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

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = productsList;

    // 1. Category Filter
    if (selectedCategory.toLowerCase() !== 'all') {
      const sCat = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        return pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.note && p.note.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    return result;
  }, [productsList, selectedCategory, searchQuery, sortBy]);

  useGSAP(
    () => {
      gsap.fromTo(
        '.gsap-cat-header',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-cat-card',
        { opacity: 0, y: 25, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.04,
          ease: 'power2.out',
        }
      );
    },
    { scope: catContainerRef, dependencies: [selectedCategory, sortBy, filteredProducts.length] }
  );

  return (
    <div ref={catContainerRef} className="w-full flex flex-col items-center min-h-screen bg-[#f4f1ea] py-10 md:py-14 px-4 sm:px-6 md:px-12 selection:bg-[#8b6d43]/20">
      {/* Clean Editorial Header */}
      <div className="gsap-cat-header w-full max-w-[1240px] mx-auto text-center mb-8 sm:mb-10">
        <span className="text-[11px] font-mono tracking-[0.24em] uppercase text-[#8b6d43] font-semibold block mb-2">
          Botanical Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-3 tracking-wide font-normal">
          The Apothecary Shelf
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto tracking-wide leading-relaxed font-light mb-6">
          Cold-pressed Ayurvedic formulations and single-origin botanical remedies for hair, skin, and daily vitality.
        </p>

        {/* Search & Sort Controls Bar */}
        <div className="w-full max-w-xl mx-auto mb-6 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by herb, formulation, ritual..."
              className="w-full pl-10 pr-9 py-2.5 bg-white/90 border border-[#d2c2ad]/80 rounded-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43] focus:ring-1 focus:ring-[#8b6d43] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-auto self-stretch sm:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/90 border border-[#d2c2ad]/80 rounded-full text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#8b6d43] shadow-2xs cursor-pointer appearance-none pr-8"
              aria-label="Sort formulations"
            >
              <option value="featured">Featured Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Scrollable / Flexible Category Pill Bar */}
        <div className="w-full max-w-4xl mx-auto flex items-center justify-start sm:justify-center overflow-x-auto pb-2 sm:pb-0 gap-1.5 no-scrollbar px-1">
          {availableCategories.map((cat) => {
            const isActive =
              selectedCategory.toLowerCase() === cat.toLowerCase() ||
              (selectedCategory.toLowerCase() !== 'all' &&
                cat.toLowerCase() !== 'all' &&
                (selectedCategory.toLowerCase().includes(cat.toLowerCase()) ||
                  cat.toLowerCase().includes(selectedCategory.toLowerCase())));
            const count = categoryCounts[cat] ?? 0;

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
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-[#ede6dc]/90 text-neutral-700 hover:text-neutral-950 hover:bg-white/90 border border-[#d2c2ad]/60'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-black/8 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Apothecary Product Grid */}
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-16 items-stretch">
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white/50 border border-[#e8e2d8] rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#faf6f0] border border-[#d2c2ad]/60 flex items-center justify-center mx-auto mb-3 text-[#8b6d43]">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-serif text-lg font-medium text-neutral-900 mb-1">No botanical formulations found</p>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              {searchQuery
                ? `No remedies matched "${searchQuery}". Try searching for another herb or ingredient.`
                : 'No formulations are currently assigned to this ritual category.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Reset Filters & View All
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
