import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  ThumbsUp,
  X,
  MapPin,
  Check,
  ShieldCheck,
  Truck,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { Product, products as defaultProducts } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { gsap, useGSAP } from '../lib/gsap';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface ReviewItem {
  id: number;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpfulCount: number;
  verified: boolean;
}

function toInr(rawPrice: number) {
  const inr = Math.round(rawPrice);
  const mrp = Math.round(inr * 1.25);
  return {
    price: inr,
    mrp,
    discount: Math.round(((mrp - inr) / mrp) * 100),
    priceStr: `₹${inr.toLocaleString('en-IN')}`,
    mrpStr: `₹${mrp.toLocaleString('en-IN')}`,
    savedStr: `₹${(mrp - inr).toLocaleString('en-IN')}`,
  };
}

const REVIEWS: ReviewItem[] = [
  {
    id: 1,
    author: 'Ananya Sharma',
    location: 'New Delhi',
    rating: 5,
    date: '9 Jan 2026',
    title: 'Visible results within two weeks',
    content:
      'Persistent marks and dullness have noticeably softened after regular evening application. The herbal scent is grounding, clean, and completely free of artificial perfume.',
    helpfulCount: 34,
    verified: true,
  },
  {
    id: 2,
    author: 'Vikramaditya Iyer',
    location: 'Bengaluru',
    rating: 5,
    date: '14 Dec 2025',
    title: 'Authentic formulation that absorbs cleanly',
    content:
      'Unlike standard commercial formulations, this leaves no greasy film or pore-clogging residue. My skin feels nourished, calm, and naturally balanced.',
    helpfulCount: 21,
    verified: true,
  },
  {
    id: 3,
    author: 'Meera Nambiar',
    location: 'Kochi',
    rating: 5,
    date: '28 Nov 2025',
    title: 'Small batch quality is evident',
    content:
      'The texture and purity remind me of traditional home preparations, but with modern pharmaceutical refinement. Will definitely repurchase.',
    helpfulCount: 15,
    verified: true,
  },
];

const FAQS = [
  {
    q: 'How soon can I expect visible results?',
    a: 'Most customers notice improved hydration and radiance within the first week (two to three uses). Full tone evening and skin-barrier balance typically occur over two to four weeks of consistent ritual practice.',
  },
  {
    q: 'Is this formulation suitable for sensitive skin?',
    a: 'Yes. All formulations are sulphate-free, paraben-free, and mineral-oil-free. As with any potent botanical extract, we recommend a 24-hour patch test behind the ear prior to initial use.',
  },
  {
    q: 'Can this be layered with other daily skincare products?',
    a: 'Absolutely. Apply after cleansing and misting, allowing 60 seconds for cellular absorption before layering sunscreen or daytime moisturizer.',
  },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onNavigate }) => {
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product>(() => {
    return defaultProducts.find((p) => String(p.id) === String(productId)) || defaultProducts[0];
  });
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'usage' | 'storage'>('ingredients');
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>(REVIEWS);
  const [helpfulVoted, setHelpfulVoted] = useState<Record<number, boolean>>({});
  const [reviewFilter, setReviewFilter] = useState<'all' | 'verified'>('all');
  const [writeOpen, setWriteOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [rForm, setRForm] = useState({ author: '', location: '', rating: 5, title: '', content: '' });
  const [rSuccess, setRSuccess] = useState(false);

  const detailRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!product) return;
      gsap.fromTo('.pdp-gallery', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo('.pdp-info', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.08, ease: 'power2.out' });
    },
    { scope: detailRef, dependencies: [productId] }
  );

  useEffect(() => {
    const found = defaultProducts.find((p) => String(p.id) === String(productId)) || defaultProducts[0];
    setProduct(found);
    setSelectedImage(found.image);
    setQuantity(1);
    setPinResult(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productId]);

  if (!product) return null;

  const p = toInr(product.price);
  const images = (product.gallery?.length ? product.gallery : [product.image]).filter((v, i, a) => a.indexOf(v) === i);
  const recommendations = defaultProducts
    .filter((x) => String(x.id) !== String(product.id))
    .sort((a, b) => (a.category === product.category ? -1 : b.category === product.category ? 1 : 0))
    .slice(0, 3);
  const filtered = reviews.filter((r) => (reviewFilter === 'verified' ? r.verified : true));

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const code = pin.trim();
    if (!/^\d{6}$/.test(code)) {
      setPinResult({ ok: false, msg: 'Enter a valid 6-digit PIN code.' });
      return;
    }
    const metro = ['11', '40', '56', '60', '50', '70'].some((pfx) => code.startsWith(pfx));
    setPinResult({
      ok: true,
      msg: metro
        ? `Express delivery to ${code}: arrives in 2 business days. Free shipping.`
        : `Standard delivery to ${code}: arrives in 3-4 business days. Free shipping.`,
    });
  };

  const handleHelpful = (id: number) => {
    if (helpfulVoted[id]) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r)));
    setHelpfulVoted((prev) => ({ ...prev, [id]: true }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rForm.author.trim() || !rForm.title.trim() || !rForm.content.trim()) return;
    setReviews([
      {
        id: Date.now(),
        author: rForm.author.trim(),
        location: rForm.location.trim() || 'India',
        rating: rForm.rating,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        title: rForm.title.trim(),
        content: rForm.content.trim(),
        helpfulCount: 0,
        verified: true,
      },
      ...reviews,
    ]);
    setRSuccess(true);
    setRForm({ author: '', location: '', rating: 5, title: '', content: '' });
    setTimeout(() => {
      setRSuccess(false);
      setWriteOpen(false);
    }, 1600);
  };

  return (
    <div ref={detailRef} className="w-full bg-[#fbfbf8] min-h-screen selection:bg-[#8b6d43]/20">
      {/* ── BREADCRUMB & BACK NAVIGATION ─────────────────────────────── */}
      <div className="border-b border-[#e8e2d8]/60 bg-[#f7f5ef]/50">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dispensary</span>
          </button>
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-neutral-400 font-light truncate">
            <span className="hover:text-neutral-700 cursor-pointer" onClick={() => onNavigate('home')}>Home</span>
            <span>/</span>
            <span
              className="hover:text-neutral-700 cursor-pointer uppercase tracking-wider"
              onClick={() => onNavigate('categories', { category: product.category })}
            >
              {product.category}
            </span>
            <span>/</span>
            <span className="text-neutral-800 font-medium truncate max-w-[240px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── HERO SHOWCASE ───────────────────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Gallery Showcase (Left Column - 6 cols) */}
          <div className="pdp-gallery lg:col-span-6 flex flex-col">
            {/* Main Stage */}
            <div className="aspect-square w-full rounded-2xl bg-[#f5f1ea]/80 border border-[#e8e2d8]/80 p-8 sm:p-14 flex items-center justify-center relative overflow-hidden group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-darken transition-transform duration-700 ease-out group-hover:scale-105 drop-shadow-md"
              />
              {product.volume && (
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[11px] font-mono tracking-wider text-neutral-700 border border-neutral-200 shadow-2xs">
                  {product.volume}
                </span>
              )}
            </div>

            {/* Thumbnail Switcher */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-[#f5f1ea]/80 p-2 border transition-all duration-200 flex-shrink-0 cursor-pointer ${
                      selectedImage === img
                        ? 'border-[#8b6d43] ring-2 ring-[#8b6d43]/30 shadow-xs'
                        : 'border-[#e8e2d8] hover:border-neutral-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain mix-blend-darken" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Purchase Ledger (Right Column - 6 cols) */}
          <div className="pdp-info lg:col-span-6 flex flex-col">
            {/* Category Eyebrow & Badges */}
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-mono tracking-[0.22em] uppercase text-[#8b6d43] font-semibold">
                {product.category}
              </span>
              {product.badge && (
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] font-medium">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Title - Elegant Editorial Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl text-neutral-900 font-serif font-normal tracking-wide leading-snug mb-3">
              {product.name}
            </h1>

            {/* Stars & Reviews Counter */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex text-[#8b6d43]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs text-neutral-800 font-medium">
                4.9 ({reviews.length + 38} customer ratings)
              </span>
            </div>

            {/* Price Row */}
            <div className="py-4 border-y border-[#e8e2d8]/70 mb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-serif font-semibold text-neutral-900">
                  {p.priceStr}
                </span>
                {p.mrp > p.price && (
                  <>
                    <span className="text-base text-neutral-400 line-through font-mono">
                      {p.mrpStr}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {p.discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-light mt-1.5">
                {product.volume || '100 G'} · Inclusive of all applicable taxes
              </p>
            </div>

            {/* Editorial Description */}
            <p className="text-neutral-700 text-sm sm:text-[15px] leading-relaxed font-light mb-7">
              {product.description}
            </p>

            {/* Quantity Stepper & Unified Add to Bag CTA */}
            <div className="space-y-3 mb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Stepper */}
                <div className="inline-flex items-center justify-between border border-neutral-300 rounded-full bg-white h-12 px-3 gap-3 self-start sm:self-auto min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-sm font-semibold text-neutral-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Primary Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 px-8 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] ${
                    addedToCart
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#8b6d43] hover:bg-[#725732] text-white'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                      <span className="opacity-60">·</span>
                      <span className="font-mono">₹{(p.price * quantity).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Delivery Estimator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f7f5ef]/80 border border-[#e8e2d8] space-y-3 mb-6">
              <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-700 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8b6d43]" />
                Estimate Delivery Time
              </span>
              <form onSubmit={handlePinCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 h-10 px-4 rounded-full border border-neutral-300 bg-white text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43]"
                />
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Check
                </button>
              </form>
              {pinResult && (
                <p className={`text-xs font-medium ${pinResult.ok ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {pinResult.msg}
                </p>
              )}
            </div>

            {/* Apothecary Trust Pillars */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-neutral-700">
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/70 border border-[#e8e2d8]/60">
                <Leaf className="w-4 h-4 text-[#8b6d43] mb-1.5" />
                <span className="text-[11px] font-medium leading-tight text-neutral-900">100% Pure Botanical</span>
                <span className="text-[10px] text-neutral-500 font-light mt-0.5">Cold-pressed herbs</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/70 border border-[#e8e2d8]/60">
                <Truck className="w-4 h-4 text-[#8b6d43] mb-1.5" />
                <span className="text-[11px] font-medium leading-tight text-neutral-900">Complimentary Shipping</span>
                <span className="text-[10px] text-neutral-500 font-light mt-0.5">Orders above ₹499</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/70 border border-[#e8e2d8]/60">
                <Sparkles className="w-4 h-4 text-[#8b6d43] mb-1.5" />
                <span className="text-[11px] font-medium leading-tight text-neutral-900">Artisanal Batches</span>
                <span className="text-[10px] text-neutral-500 font-light mt-0.5">Crafted in Tamil Nadu</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BOTANICAL DISCLOSURE & USAGE RITUAL ──────────────────────── */}
      <section className="bg-[#f7f5ef] border-t border-b border-[#e8e2d8] py-14 sm:py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#8b6d43] font-semibold block mb-2">
              Formulation & Practice
            </span>
            <h2 className="text-2xl sm:text-3xl text-neutral-900 font-serif font-normal tracking-wide">
              Botanical Integrity & Application Ritual
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 sm:gap-10 border-b border-[#d2c2ad]/60 mb-8 overflow-x-auto">
            {[
              { id: 'ingredients', label: 'Active Botanicals' },
              { id: 'usage', label: 'Daily Application Ritual' },
              { id: 'storage', label: 'Storage & Potency' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-3.5 text-xs sm:text-sm border-b-2 -mb-px transition-all cursor-pointer whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: INGREDIENTS */}
          {activeTab === 'ingredients' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Single-Origin Extracts</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Hand-harvested botanicals sourced directly from cooperative growers in Southern India, cold-processed to preserve fragile active nutrients.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Clean Formulation Standards</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Zero synthetic sulphates (SLS/SLES), mineral oils, phthalates, synthetic colourants, or petroleum derivatives.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Physiological pH Balance</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Calibrated to skin and scalp physiological balance (pH 5.5 to 6.2) to safeguard the delicate dermal microbiome.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: USAGE */}
          {activeTab === 'usage' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <span className="text-[10px] font-mono text-[#8b6d43] uppercase tracking-widest font-semibold block mb-1">Step 1</span>
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Awaken</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Dispense a measured quantity into clean fingertips. Warm lightly between palms to activate the volatile botanical essence.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <span className="text-[10px] font-mono text-[#8b6d43] uppercase tracking-widest font-semibold block mb-1">Step 2</span>
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Massage</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Smooth in gentle upward circular motions across target areas, encouraging lymphatic drainage and deep transdermal delivery.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <span className="text-[10px] font-mono text-[#8b6d43] uppercase tracking-widest font-semibold block mb-1">Step 3</span>
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Absorb</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Allow 60 seconds for complete dermal absorption before continuing with your broader morning or evening routine.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE */}
          {activeTab === 'storage' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Photoprotective Shield</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Keep in a cool, dry apothecary drawer or shaded shelf away from direct window sunlight to shield bioactive botanicals from photolysis.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Thermal Stability</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Maintain at consistent ambient temperatures (18°C to 28°C). Do not refrigerate or store near high-heat water heaters.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8]">
                <h3 className="font-serif text-lg text-neutral-900 font-medium mb-1.5">Freshness Period</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Sealed formulations retain peak freshness for 24 months. Once opened, use within 6 to 12 months for highest aromatic and herbal vitality.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── RECOMMENDED COMPLEMENTS ──────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-5 border-b border-[#e8e2d8]">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#8b6d43] font-semibold block mb-2">
                Curated Synergies
              </span>
              <h2 className="text-2xl sm:text-3xl text-neutral-900 font-serif font-normal tracking-wide">
                Complementary Formulations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="text-xs font-semibold uppercase tracking-wider text-[#8b6d43] hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore All Catalog</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recommendations.map((rec) => (
              <ProductCard
                key={String(rec.id)}
                product={rec}
                onNavigate={onNavigate}
                className="w-full"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ACCORDION ───────────────────────────────────────────── */}
      <section className="bg-white border-t border-b border-[#e8e2d8] py-14 sm:py-18">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#8b6d43] font-semibold block mb-2">
                Clarity & Care
              </span>
              <h2 className="text-2xl sm:text-3xl text-neutral-900 font-serif font-normal tracking-wide mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                Clear answers regarding ingredient origins, application cadence, and physiological suitability.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-[#e8e2d8]">
              {FAQS.map((faq, i) => {
                const open = faqOpen === i;
                return (
                  <div key={i} className="py-4">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(open ? null : i)}
                      className="w-full flex items-center justify-between py-2 text-left gap-4 cursor-pointer"
                    >
                      <span className="text-sm font-serif font-medium text-neutral-900">{faq.q}</span>
                      <span className="text-lg text-[#8b6d43] font-bold flex-shrink-0 w-6 text-center">
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    {open && (
                      <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed pt-2 pb-3">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ────────────────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-[#e8e2d8] mb-8">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#8b6d43] font-semibold block mb-1.5">
              Verified Feedback
            </span>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl sm:text-5xl font-serif text-neutral-900 font-medium">4.9</span>
              <div>
                <div className="flex text-[#8b6d43] mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 font-light">Based on {reviews.length + 38} verified customer experiences</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReviewFilter(reviewFilter === 'all' ? 'verified' : 'all')}
              className="text-xs px-3.5 py-2 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 font-medium transition-colors cursor-pointer"
            >
              {reviewFilter === 'all' ? 'Show Verified Only' : 'Show All Reviews'}
            </button>
            <button
              type="button"
              onClick={() => setWriteOpen(!writeOpen)}
              className="text-xs px-4 py-2 rounded-full bg-[#8b6d43] hover:bg-[#725732] text-white font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Review Form */}
        {writeOpen && (
          <div className="bg-white border border-[#e8e2d8] rounded-2xl p-6 sm:p-8 mb-8 shadow-xs max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-neutral-900 font-medium">Share Your Experience</h3>
              <button
                type="button"
                onClick={() => setWriteOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {rSuccess ? (
              <p className="text-xs font-semibold text-emerald-800 py-4">Thank you. Your review has been recorded.</p>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 block mb-1">Name *</label>
                    <input
                      required
                      value={rForm.author}
                      onChange={(e) => setRForm({ ...rForm, author: e.target.value })}
                      placeholder="Ananya S."
                      className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-[#8b6d43]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 block mb-1">City</label>
                    <input
                      value={rForm.location}
                      onChange={(e) => setRForm({ ...rForm, location: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-[#8b6d43]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 block mb-1">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRForm({ ...rForm, rating: s })}
                        className="cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${s <= rForm.rating ? 'fill-[#8b6d43] text-[#8b6d43]' : 'text-neutral-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 block mb-1">Headline *</label>
                  <input
                    required
                    value={rForm.title}
                    onChange={(e) => setRForm({ ...rForm, title: e.target.value })}
                    placeholder="Summary of your ritual result"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 block mb-1">Experience *</label>
                  <textarea
                    required
                    rows={3}
                    value={rForm.content}
                    onChange={(e) => setRForm({ ...rForm, content: e.target.value })}
                    placeholder="Describe aroma, texture, and physical results."
                    className="w-full p-3 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-[#8b6d43] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#8b6d43] hover:bg-[#725732] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews Listing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((rev) => {
            const voted = !!helpfulVoted[rev.id];
            return (
              <article key={rev.id} className="p-6 rounded-2xl bg-white border border-[#e8e2d8] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-[#8b6d43]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">{rev.date}</span>
                  </div>
                  <h4 className="font-serif text-base text-neutral-900 font-medium mb-1.5">{rev.title}</h4>
                  <p className="text-xs text-neutral-600 font-light leading-relaxed mb-4">{rev.content}</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-neutral-900 block">{rev.author}</span>
                    <span className="text-[10px] text-neutral-500 font-light">{rev.location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHelpful(rev.id)}
                    disabled={voted}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      voted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{rev.helpfulCount}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
