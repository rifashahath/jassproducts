import React, { useState, useEffect, useRef } from 'react';
import { Play, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Product, fetchLiveProducts, products as defaultProducts } from '../lib/products';
import { useCart } from '../context/CartContext';
import { gsap, useGSAP } from '../lib/gsap';

function toInr(usdPrice: number) {
  const inr = Math.round(Math.round(usdPrice * 18) / 50) * 50 - 1;
  const mrp = Math.round((inr * 1.28) / 50) * 50 - 1;
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
      title: 'HAIR CARE',
      subtitle: 'JASS PRODUCTS\nHAIR CARE SOLUTIONS',
      image: '/newcat-1.png',
      category: 'Hair Care',
    },
    {
      num: '02',
      title: 'SOAP',
      subtitle: 'NATURAL HERBAL\nSOAP BAR',
      image: '/newcat-soap.png',
      category: 'Soap & Bath',
    },
    {
      num: '03',
      title: 'TREAT',
      subtitle: 'RENEW\nSERUM',
      image: '/newcat-2.png',
      category: 'Skin Renewal',
    },
    {
      num: '04',
      title: 'HEALTH CARE',
      subtitle: 'PURE POWDERS\nCOLLECTION',
      image: '/newcat-3.png',
      category: 'Health Care',
    },
    {
      num: '05',
      title: 'HYDRATE',
      subtitle: 'HYDRATING\nCREAM',
      image: '/newcat-4.png',
      category: 'Face Nourish',
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
          <h2 className="text-3xl md:text-5xl lg:text-6xl text-[#8b6d43] mb-3 tracking-wider font-serif uppercase">
            The Daily Herbal Ritual
          </h2>
          <p className="text-xs md:text-sm font-medium text-neutral-600 tracking-[0.2em] uppercase">
            Curated 5-Step Ayurvedic Routine
          </p>
        </div>

        <div className="gsap-ritual-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-7 w-full max-w-[1440px] mx-auto px-2">
          {ritualSteps.map((step, idx) => (


            <div
              key={idx}
              onClick={() => onNavigate('categories', { category: step.category })}
              className="gsap-ritual-card flex flex-col bg-[#fbfbf8] border border-[#d2c2ad]/80 hover:border-[#8b6d43] rounded-[1.75rem] md:rounded-[2.25rem] p-3.5 sm:p-5 md:p-6 text-center shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer h-[420px] sm:h-[500px] md:h-[580px] lg:h-[640px] group"
            >
              {/* Top Text */}
              <div className="mb-2 sm:mb-4">
                <span className="text-[#9a7b4f] text-xs sm:text-sm md:text-base font-semibold tracking-wider">
                  {step.num}
                </span>
                <h3 className="text-[#9a7b4f] group-hover:text-[#8b6d43] transition-colors text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif tracking-[0.1em] uppercase mt-1 mb-1 md:mb-1.5">
                  {step.title}
                </h3>
                <p className="text-neutral-700 text-[11px] sm:text-[12px] md:text-[13px] tracking-[0.14em] uppercase whitespace-pre-line leading-snug">
                  {step.subtitle}
                </p>
              </div>

              {/* Image */}
              <div className="flex-1 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-[#f9f8f4] to-[#ebe3d5] mb-3 md:mb-4 relative shadow-[inset_0_4px_12px_rgba(139,109,67,0.06)] group/img flex items-end justify-center p-2 sm:p-3">
                <img
                  src={step.image}
                  alt={step.title}
                  style={{
                    transform: `translateY(${Math.min(50, Math.max(0, (scrollY - 100) * 0.08))}px) scale(1.05)`,
                    transformOrigin: 'bottom center',
                  }}
                  className="w-full h-full object-contain object-bottom mix-blend-darken contrast-[1.03] transition-transform duration-700 ease-out group-hover/img:scale-110 drop-shadow-sm"
                />
              </div>

              {/* Bottom CTA hint */}
              <div className="mt-auto pt-1">
                <p className="text-[#9a7b4f] text-[11px] sm:text-xs tracking-[0.18em] uppercase font-medium">
                  Shop {step.title} →
                </p>
              </div>
            </div>


          ))}
        </div>
      </section>

      {/* Apothecary Collection Section */}
      <section className="gsap-apothecary-section w-full px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-24 flex flex-col items-center bg-[#f4f1ea]">
        <div className="gsap-apothecary-header w-full max-w-[1400px] mx-auto mb-10 md:mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#8b6d43] tracking-wider font-serif uppercase">
            Our Collection
          </h2>
          <p className="text-xs md:text-sm text-neutral-500 tracking-[0.1em] sm:text-right max-w-xs">
            Handcrafted Ayurvedic formulas for hair, skin, and body
          </p>
        </div>

        {/* Products Grid */}
        <div className="gsap-apothecary-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full max-w-[1400px] mx-auto">
          {catalogProducts.slice(0, 8).map((product) => (
            <div
              key={String(product.id)}
              className="gsap-product-card group flex flex-col bg-[#fbfbf8] border border-[#d2c2ad] rounded-[1.75rem] p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
            >
              {product.badge && (
                <span className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[8px] font-bold tracking-widest uppercase shadow-sm">
                  {product.badge}
                </span>
              )}
              <div
                onClick={() => onNavigate('product', { id: String(product.id) })}
                className="w-full aspect-square rounded-2xl overflow-hidden bg-[#f4efe6] mb-4 relative flex items-center justify-center p-5 cursor-pointer"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-darken group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                />
              </div>
              <div className="flex flex-col flex-1 justify-between">

                <div className="mb-3 text-left">
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
                        {toInr(product.price).priceStr}
                      </span>
                      <span className="text-xs text-neutral-400 line-through font-mono">
                        {toInr(product.price).mrpStr}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                      In stock
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="w-full py-2.5 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="gsap-apothecary-cta mt-12">
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="px-8 py-3.5 rounded-full border-2 border-[#8b6d43] text-[#8b6d43] hover:bg-[#8b6d43] hover:text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer flex items-center gap-2"
          >
            <span>View Complete Apothecary Catalog</span>
            <ArrowRight className="w-4 h-4" />
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
