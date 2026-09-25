import React, { useState, useEffect, useRef } from 'react';
import { Play, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Product, fetchLiveProducts, products as defaultProducts } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { gsap, useGSAP } from '../lib/gsap';

function toInr(rawPrice: number) {
  const inr = Math.round(rawPrice);
  const mrp = Math.round(inr * 1.25);
  return {
    priceStr: `₹${inr.toLocaleString('en-IN')}`,
    mrpStr: `₹${mrp.toLocaleString('en-IN')}`,
    discount: Math.round(((mrp - inr) / mrp) * 100),
  };
}

interface HomePageProps {
  scrollY: number;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ scrollY, onNavigate }) => {
  const { addToCart } = useCart();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(defaultProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const homeContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. Daily Herbal Ritual Header
      gsap.fromTo(
        '.gsap-ritual-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.gsap-ritual-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 2. Ritual Cards Stagger
      gsap.fromTo(
        '.gsap-ritual-card',
        { opacity: 0, y: 45, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.gsap-ritual-grid',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 3. Apothecary Header
      gsap.fromTo(
        '.gsap-apothecary-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.gsap-apothecary-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 4. Apothecary Product Cards
      gsap.fromTo(
        '.gsap-product-card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-apothecary-grid',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 5. Apothecary CTA
      gsap.fromTo(
        '.gsap-apothecary-cta',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-apothecary-cta',
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 6. Video Shorts Header
      gsap.fromTo(
        '.gsap-video-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.gsap-video-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 7. Video Shorts Cards
      gsap.fromTo(
        '.gsap-video-card',
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-video-grid',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: homeContainerRef, dependencies: [catalogProducts] }
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoadingProducts(true);
      try {
        const liveItems = await fetchLiveProducts();
        if (isMounted && liveItems.length > 0) {
          setCatalogProducts(liveItems);
        }
      } catch (e) {
        console.warn('Catalog live fetch error:', e);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const ritualSteps = [
    {
      num: '01',
      title: 'Hair Cleanse',
      subtitle: 'Herbal Anti-Dandruff Cleanser',
      image: '/products/herbal-shampoo/main.png',
      category: 'Hair Care',
    },
    {
      num: '02',
      title: 'Inner Vitality',
      subtitle: 'Organic Dehydrated Amla Superfood',
      image: '/products/amla-powder/main.png',
      category: 'Health Care',
    },
    {
      num: '03',
      title: 'Radiance Gel',
      subtitle: 'Kashmiri Saffron & Hyaluronic Elixir',
      image: '/products/saffron-gel/main.png',
      category: 'Skincare & Creams',
    },
    {
      num: '04',
      title: 'Night Repair',
      subtitle: 'Intense Restorative Night Moisturizer',
      image: '/products/night-cream/main.png',
      category: 'Skincare & Creams',
    },
    {
      num: '05',
      title: 'Sun Defense',
      subtitle: 'Mineral Sunscreen Lotion SPF 50',
      image: '/products/sunscreen/main.png',
      category: 'Skincare & Creams',
    },
  ];

  const videoShorts = [
    {
      id: 1,
      title: 'The Jass Hair Oil Ritual',
      thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400&h=711',
    },
    {
      id: 2,
      title: 'Morning Glow Routine',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400&h=711',
    },
    {
      id: 3,
      title: 'Ayurvedic Scalp Massage',
      thumbnail: 'https://images.unsplash.com/photo-1512290900672-1f414e21a221?auto=format&fit=crop&q=80&w=400&h=711',
    },
    {
      id: 4,
      title: 'Pure Plant Synergy',
      thumbnail: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400&h=711',
    },
    {
      id: 5,
      title: 'Evening Ritual',
      thumbnail: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=400&h=711',
    },
  ];

  return (
    <div ref={homeContainerRef} className="w-full flex flex-col items-center">
      {/* The Daily Herbal Ritual Section */}
      <section className="gsap-ritual-section w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-20 flex flex-col items-center relative z-10 bg-[#f7f5ef] rounded-b-[2rem] sm:rounded-b-[2.5rem] md:rounded-b-[3rem] pt-14 md:pt-20 lg:pt-24">
        <div className="gsap-ritual-header text-center mb-12 md:mb-16">
          <span className="text-[11px] font-mono tracking-[0.24em] uppercase text-[#8b6d43] font-semibold block mb-2.5">
            5-Step Ayurvedic Regimen
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl text-neutral-900 mb-3 tracking-wide font-serif font-normal">
            The Daily Herbal Ritual
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto tracking-wide leading-relaxed font-light">
            A cohesive morning-to-night sequence restoring physiological balance from scalp to skin.
          </p>
        </div>

        <div className="gsap-ritual-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6 w-full max-w-[1440px] mx-auto px-2">
          {ritualSteps.map((step) => (
            <div
              key={step.num}
              onClick={() => onNavigate('categories', { category: step.category })}
              className="gsap-ritual-card flex flex-col justify-between bg-[#fcfbf9] hover:bg-white border border-[#e8e2d8] hover:border-[#8b6d43]/50 rounded-2xl md:rounded-3xl p-5 md:p-6 text-center shadow-xs hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 cursor-pointer group"
            >
              {/* Step Header */}
              <div className="mb-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] text-[10px] font-mono tracking-widest uppercase font-semibold mb-2">
                  Step {step.num}
                </span>
                <h3 className="text-neutral-900 group-hover:text-[#8b6d43] transition-colors text-lg sm:text-xl font-serif font-medium tracking-wide mb-1">
                  {step.title}
                </h3>
                <p className="text-neutral-500 text-xs font-light leading-snug line-clamp-1">
                  {step.subtitle}
                </p>
              </div>

              {/* Product Image Canvas - Perfectly Centered, Proportional, and Elegant */}
              <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#f5f1ea]/80 my-3 relative flex items-center justify-center p-5 group-hover:bg-[#f2ece2] transition-colors duration-500">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-contain mix-blend-darken transition-transform duration-700 ease-out group-hover:scale-108 drop-shadow-xs"
                />
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-2 w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('categories', { category: step.category });
                  }}
                  className="w-full py-2.5 rounded-full border border-neutral-300 group-hover:border-[#8b6d43] text-neutral-800 group-hover:bg-[#8b6d43] group-hover:text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>Explore Step</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Apothecary Collection Section */}
      <section className="gsap-apothecary-section w-full px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-24 flex flex-col items-center bg-[#f4f1ea]">
        <div className="gsap-apothecary-header w-full max-w-[1400px] mx-auto mb-12 md:mb-16 text-center">
          <span className="text-[11px] font-mono tracking-[0.24em] uppercase text-[#8b6d43] font-semibold block mb-2.5">
            Pure Botanical Dispensary
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-neutral-900 font-serif font-normal tracking-wide mb-3">
            The Apothecary Collection
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto tracking-wide leading-relaxed font-light">
            Cold-pressed botanical elixirs, targeted scalp oils, and restorative herbal balms crafted in small batches.
          </p>
        </div>

        {/* Products Grid */}
        <div className="gsap-apothecary-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7 w-full max-w-[1400px] mx-auto">
          {catalogProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={String(product.id)}
              product={product}
              onNavigate={onNavigate}
              className="gsap-product-card"
            />
          ))}
        </div>

        <div className="gsap-apothecary-cta mt-14 sm:mt-16">
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md"
          >
            <span>Explore All Formulations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* The Ritual In Action - Video Shorts Section */}
      <section className="gsap-video-section w-full py-16 md:py-24 bg-[#FAF9F6]">
        <div className="gsap-video-header max-w-[1400px] mx-auto px-6 sm:px-10 md:px-14 mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl text-[#8b6d43] font-serif uppercase tracking-wider mb-2">
              The Ritual In Action
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 uppercase tracking-widest">
              Step-by-step Ayurvedic routines from our herbalists
            </p>
          </div>
          <a
            href="https://www.youtube.com/@jassayurveda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#8b6d43] border border-[#8b6d43] px-5 py-2.5 rounded-full hover:bg-[#8b6d43] hover:text-white transition-colors duration-300 self-start md:self-auto cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            Watch on YouTube
          </a>
        </div>

        <div className="w-full relative">
          <div className="gsap-video-grid flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory px-6 sm:px-10 md:px-14 pb-8 no-scrollbar">
            {videoShorts.map((video) => (
              <div
                key={video.id}
                className="gsap-video-card group relative flex-none w-[260px] sm:w-[280px] md:w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden snap-center cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 bg-neutral-900"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#8b6d43]/90 transition-colors duration-300 transform group-hover:scale-110">
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <h3 className="text-white font-serif text-xl leading-tight">
                    {video.title}
                  </h3>
                </div>
              </div>
            ))}
            <div className="flex-none w-4 sm:w-6 md:w-8" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
};
