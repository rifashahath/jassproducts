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
} from 'lucide-react';
import { Product, products as defaultProducts } from '../lib/products';
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

function toInr(usdPrice: number) {
  const inr = Math.round(Math.round(usdPrice * 18) / 50) * 50 - 1;
  const mrp = Math.round((inr * 1.28) / 50) * 50 - 1;
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
    title: 'Scalp completely cleared in under two weeks',
    content:
      'Delhi hard water had been causing persistent flaking for months. After two weeks of use, three times a week, the flaking stopped entirely. The neem and rosemary scent is natural and grounding—nothing synthetic.',
    helpfulCount: 34,
    verified: true,
  },
  {
    id: 2,
    author: 'Devika Patel',
    location: 'Mumbai',
    rating: 5,
    date: '22 Jan 2026',
    title: 'Light enough for coastal humidity, effective against oiliness',
    content:
      'Most Ayurvedic shampoos are too heavy for Mumbai weather. This one rinses completely clean and controls scalp oiliness through the day. No residue, no buildup.',
    helpfulCount: 21,
    verified: true,
  },
  {
    id: 3,
    author: 'Rohit Verma',
    location: 'Bengaluru',
    rating: 5,
    date: '4 Feb 2026',
    title: 'Borewell water damage reversed after one month',
    content:
      'Borewell water in Bengaluru had made my hair dry and brittle over a year. Within a month of switching to this, tensile strength improved and breakage reduced noticeably. The shikakai lather is gentle.',
    helpfulCount: 17,
    verified: true,
  },
  {
    id: 4,
    author: 'Priya Menon',
    location: 'Kochi',
    rating: 5,
    date: '11 Feb 2026',
    title: 'Genuine cold-process formula, not a marketed repacking',
    content:
      'The full botanical disclosure with Latin binomials on the box is something very few Indian brands offer. The reetha saponin lather feels completely different from sulphate foam.',
    helpfulCount: 12,
    verified: true,
  },
];

const HERBS = [
  {
    herb: 'Neem Leaf',
    binomial: 'Azadirachta Indica',
    origin: 'Western Ghats',
    role: 'Antifungal phytonutrients combat Malassezia yeast to halt chronic scaling without stripping the lipid mantle.',
  },
  {
    herb: 'Bhringraj',
    binomial: 'Eclipta Alba',
    origin: 'Kerala Foothills',
    role: 'Root adaptogen that counteracts hard-water mineral embrittlement and anchors hair follicles.',
  },
  {
    herb: 'Wild Amla',
    binomial: 'Emblica Officinalis',
    origin: 'Central Deccan',
    role: 'Potent ascorbic acid complexes smooth cuticle scales and impart natural tensile luster.',
  },
  {
    herb: 'Shikakai & Reetha',
    binomial: 'Acacia Concinna',
    origin: 'Southern Highlands',
    role: 'Wild saponin berry decoction providing a low-foaming, pH 5.5 physiological cleanse without synthetic surfactants.',
  },
];

const FAQS = [
  {
    q: 'How soon does flaking stop?',
    a: 'Most customers notice a reduction in visible flaking within the first week — two or three washes. Complete cessation typically occurs by the end of the second week with consistent use.',
  },
  {
    q: 'Is it safe for colour-treated or keratin-treated hair?',
    a: 'Yes. The formula is sulphate-free, paraben-free, and silicone-free. It does not strip colour pigments or disrupt keratin bonds. Safe for all chemical treatments.',
  },
  {
    q: 'Can I use this daily?',
    a: 'We recommend two to three washes per week for the first month. Once the scalp is balanced, some customers use it as their daily shampoo without issue.',
  },
  {
    q: 'Do you offer Cash on Delivery?',
    a: 'Yes. COD is available across all serviceable Indian pincodes. You can also pay by UPI, cards, or net banking. Prepaid UPI orders receive an automatic 5% discount.',
  },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onNavigate }) => {
  const { addToCart } = useCart();
  const init = defaultProducts.find((p) => String(p.id) === String(productId)) || defaultProducts[0];

  const [product, setProduct] = useState<Product | null>(init);
  const [selectedImage, setSelectedImage] = useState<string>(init?.image || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'usage' | 'storage'>('ingredients');
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedRecId, setAddedRecId] = useState<string | number | null>(null);
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
      gsap.fromTo('.pdp-gallery', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo('.pdp-info', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.06, ease: 'power2.out' });
    },
    { scope: detailRef, dependencies: [productId] }
  );

  useEffect(() => {
    const found = defaultProducts.find((p) => String(p.id) === String(productId)) || defaultProducts[0];
    setProduct(found);
    setSelectedImage(found.image);
    setQuantity(1);
    setPinResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        ? `Delivery to ${code} — arrives in 2 business days. Free shipping.`

        : `Delivery to ${code} — arrives in 4 business days. Free shipping.`,
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
    setTimeout(() => { setRSuccess(false); setWriteOpen(false); }, 1600);
  };

  return (
    <div
      ref={detailRef}
      className="w-full bg-[#F7F6F3]"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {/* ── BREADCRUMB ─────────────────────────────── */}
      <div className="border-b border-[#EAEAEA] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 h-11 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="flex items-center gap-1.5 text-[#787774] hover:text-[#111111] transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#787774]">
            <span className="uppercase tracking-wider">{product.category}</span>
            <span>/</span>
            <span className="text-[#2F3437]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────── */}

    <div className="bg-white border-b border-[#EAEAEA]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Gallery */}
          <div className="pdp-gallery">


            <div className="aspect-square bg-[#F7F6F3] border border-[#EAEAEA] rounded-xl flex items-center justify-center overflow-hidden relative">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-4/5 h-4/5 object-contain mix-blend-multiply"
              />
            </div>


            {images.length > 1 && (

              <div className="flex gap-2.5 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg border flex items-center justify-center bg-white overflow-hidden cursor-pointer transition-all ${
                      selectedImage === img ? 'border-[#111111]' : 'border-[#EAEAEA] hover:border-[#999]'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>

            )}
          </div>

          {/* Purchase info */}
          <div className="pdp-info">
            {/* Product name */}
            <h1
              className="text-[2.4rem] sm:text-[2.8rem] text-neutral-950 font-serif font-bold leading-tight tracking-tight uppercase mb-3"
            >
              {product.name}
            </h1>

            {/* Stars */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex text-[#8b6d43]">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <span className="text-sm text-neutral-900 font-bold">4.9</span>
              <span className="text-sm text-neutral-700 font-medium">&bull; {reviews.length + 38} Verified Customer Reviews</span>
            </div>

            {/* Price block */}
            <div className="mb-6 space-y-2">
              <div className="flex items-baseline gap-3.5">
                <span className="text-4xl sm:text-[2.75rem] font-serif font-extrabold text-neutral-950 tracking-tight leading-none">
                  {p.priceStr}
                </span>
                <span className="text-base sm:text-lg text-[#9C8F80]/80 line-through font-mono select-none">
                  {p.mrpStr}
                </span>
                <span className="text-xs font-mono font-bold text-[#8B6D43] uppercase tracking-wider">
                  ({p.discount}% OFF &bull; SAVE {p.savedStr})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-600 font-sans">
                <span>Net Volume: <strong className="font-semibold text-neutral-900">{product.volume || '250 ML'}</strong></span>
                <span className="text-neutral-300">&bull;</span>
                <span>Taxes Included</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> In stock &bull; Ready to ship
                </span>
              </div>
            </div>

            {/* Description — specific, high readability */}
            <div className="mb-6">
              <p className="text-[#3A332B] text-[15px] sm:text-base leading-[1.75] font-normal pl-3.5 border-l-2 border-[#8B6D43]/40 italic font-serif">
                &ldquo;{product.description}&rdquo;
              </p>
            </div>


            {/* Quantity + CTAs */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono uppercase tracking-[0.16em] text-neutral-600 font-bold">Quantity</span>
                  <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-neutral-950">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {quantity > 1 && (
                  <span className="text-xs font-mono text-[#8B6D43] font-semibold">
                    Subtotal: ₹{(p.price * quantity).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 rounded-full bg-[#86683F] hover:bg-[#765B35] active:scale-[0.99] text-white text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-[0_4px_16px_rgba(134,104,63,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] border border-[#9A7D52]/40"
              >
                {addedToCart ? (
                  <><Check className="w-4 h-4 stroke-[2.5]" /> Added to Bag</>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 stroke-[2]" />
                    <span>Add to Bag</span>
                    <span className="text-white/50">&bull;</span>
                    <span>₹{(p.price * quantity).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Pincode checker */}
            <div className="border-t border-[#d2c2ad]/80 pt-5 space-y-2.5">
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-neutral-800 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8b6d43]" /> Check delivery to your pincode
              </p>
              <form onSubmit={handlePinCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 h-10 px-4 rounded-full border border-[#d2c2ad] bg-white text-sm text-neutral-900 font-mono font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43] transition-colors"
                />
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full border-2 border-[#8B6D43] bg-white hover:bg-[#8B6D43] hover:text-white text-[#8B6D43] text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98]"
                >
                  Verify
                </button>
              </form>
              {pinResult && (
                <p className={`text-xs font-medium leading-relaxed ${pinResult.ok ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>
                  {pinResult.msg}
                </p>
              )}
              <div className="grid grid-cols-3 pt-3.5 border-t border-[#d2c2ad]/60 text-center gap-3">
                {[['Free shipping', 'Orders above ₹499'], ['COD available', 'Cash at doorstep'], ['7-day returns', 'Hassle-free']].map(([h, s]) => (
                  <div key={h}>
                    <p className="text-xs font-bold text-neutral-900">{h}</p>
                    <p className="text-[11px] text-neutral-600 font-medium mt-0.5">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


      {/* ── EDITORIAL APOTHECARY SPECIFICATION & RITUAL ─────── */}
      {product.category === 'HAIR CARE' && (
        <section className="bg-[#f7f5f0] border-t border-b border-[#e3dac9] py-16 sm:py-20">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-10">

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#d2c2ad]/60 mb-10">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8b6d43] font-semibold mb-2.5">
                  Specification &bull; Origin &bull; Practice
                </p>
                <h2
                  className="text-2xl sm:text-3xl lg:text-4xl text-neutral-950 font-serif font-bold tracking-tight leading-tight"
                >
                  Botanical Formulation &amp; Daily Care
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 max-w-md leading-relaxed font-normal">
                Single-origin herbs cold-extracted below 40°C. Formulated specifically to counteract hard water mineral deposits and restore scalp equilibrium.
              </p>
            </div>

            {/* Editorial Tab Switcher */}
            <div className="flex gap-8 sm:gap-12 border-b border-[#d2c2ad]/50 mb-10 overflow-x-auto">
              {([
                { id: 'ingredients', num: '01', label: 'Active Botanicals' },
                { id: 'usage', num: '02', label: 'Application Ritual' },
                { id: 'storage', num: '03', label: 'Apothecary Preservation' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-xs sm:text-sm border-b-2 -mb-px transition-all cursor-pointer whitespace-nowrap flex items-baseline gap-2 ${
                    activeTab === tab.id
                      ? 'border-neutral-950 text-neutral-950 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-950 font-medium'
                  }`}
                >
                  <span className="font-mono text-[10px] text-[#8b6d43]">{tab.num}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: ACTIVE BOTANICALS LEDGER */}
            {activeTab === 'ingredients' && (
              <div className="space-y-10">
                {/* Botanical Ledger Rows */}
                <div className="divide-y divide-[#d2c2ad]/50 border-t border-b border-[#d2c2ad]/50">
                  {HERBS.map((item) => (
                    <div key={item.herb} className="py-6 sm:py-7 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                      <div className="md:col-span-4">
                        <div className="flex items-baseline gap-2.5">
                          <h3 className="font-serif font-bold text-neutral-950 text-lg sm:text-xl">{item.herb}</h3>
                          <span className="text-xs font-mono text-neutral-500 italic">({item.origin})</span>
                        </div>
                        <p className="text-xs font-mono text-[#8b6d43] italic mt-0.5">{item.binomial}</p>
                      </div>
                      <div className="md:col-span-8">
                        <p className="text-sm text-neutral-800 leading-relaxed">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulation Standards & Full INCI Declaration */}
                <div className="pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-4 space-y-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8b6d43] font-bold">
                      Formulation Standards
                    </p>
                    <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b6d43]"></span>
                        <span>Zero synthetic sulphates (SLS / SLES)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b6d43]"></span>
                        <span>No chemical silicones, parabens, or phthalates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b6d43]"></span>
                        <span>Ambient cold-press decoction below 40°C</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b6d43]"></span>
                        <span>Scalp physiological balance (pH 5.5 – 6.2)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-8 border-l border-[#d2c2ad]/50 pl-0 lg:pl-8">
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8b6d43] font-bold mb-2">
                      Complete Botanical Disclosure (INCI)
                    </p>
                    <p className="font-mono text-xs text-neutral-700 leading-[2] bg-white/60 p-4 rounded-lg border border-[#d2c2ad]/40">
                      <strong className="font-semibold text-neutral-900">Azadirachta Indica</strong> (Neem Leaf Extract),{' '}
                      <strong className="font-semibold text-neutral-900">Rosmarinus Officinalis</strong> (Rosemary Essential Oil),{' '}
                      <strong className="font-semibold text-neutral-900">Eclipta Alba</strong> (Bhringraj Whole Plant),{' '}
                      <strong className="font-semibold text-neutral-900">Emblica Officinalis</strong> (Wild Amla Fruit Extract),{' '}
                      <strong className="font-semibold text-neutral-900">Acacia Concinna</strong> (Shikakai Pod Extract),{' '}
                      <strong className="font-semibold text-neutral-900">Sapindus Mukorossi</strong> (Reetha Saponin Extract), Cold-Pressed Virgin Coconut Oil, Himalayan Mineral Sea Salt, Natural Tocopherol (Vitamin E), Aqua.
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-2 font-mono">
                      All extracts distilled without chemical solvent residue. 100% biodegradable formula.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: APPLICATION RITUAL */}
            {activeTab === 'usage' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 border-t border-b border-[#d2c2ad]/50 py-10">
                  {[
                    {
                      stage: 'Stage I',
                      action: 'Preparation',
                      detail: 'Dispense one to two portions into moist palms. Rub briefly together to awaken the volatile plant oils and activate the concentrated herbal decoction.',
                    },
                    {
                      stage: 'Stage II',
                      action: 'Scalp Massage',
                      detail: 'Work deliberately into the damp scalp using circular fingertip pressure for two to three minutes. Concentrate on the hairline and crown to invigorate follicular circulation.',
                    },
                    {
                      stage: 'Stage III',
                      action: 'Cool Rinse',
                      detail: 'Rinse completely with cool or lukewarm water until clear. Cool water contracts hair cuticles and prevents mineral deposits common in Indian borewell water.',
                    },
                  ].map((s) => (
                    <div key={s.stage} className="space-y-3">
                      <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8b6d43] font-bold">
                        {s.stage}
                      </p>
                      <h3 className="text-xl font-serif font-bold text-neutral-950">
                        {s.action}
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-white/70 border border-[#d2c2ad]/50 rounded-lg max-w-2xl">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#8b6d43] font-bold mb-1">
                    Usage Cadence
                  </p>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    Use two to three times weekly. Because natural reetha and shikakai lather without petroleum sulfates, the lather is light and low-foaming while delivering deep follicular purity.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: APOTHECARY PRESERVATION */}
            {activeTab === 'storage' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 border-t border-b border-[#d2c2ad]/50 py-10">
                {[
                  {
                    title: 'Photoprotective Glass',
                    spec: 'UV Shielding',
                    body: 'Bottled in pharmaceutical-grade amber glass to shield delicate cold-pressed phytonutrients from photolysis. Keep out of direct sun on a shaded bathroom shelf.',
                  },
                  {
                    title: 'Thermal Range',
                    spec: '15°C – 30°C',
                    body: 'Maintain at consistent ambient room temperature. Do not refrigerate. The cold-pressed virgin coconut base stays fluid and stable in normal bathroom climates.',
                  },
                  {
                    title: 'Formula Stability',
                    spec: '24 Months Sealed',
                    body: 'Unopened bottles maintain full botanical potency for 24 months. After breaking the inner seal, use within 12 months for peak aromatic and therapeutic efficacy.',
                  },
                ].map((item) => (
                  <div key={item.title} className="space-y-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8b6d43] font-bold">
                      {item.spec}
                    </p>
                    <h3 className="text-xl font-serif font-bold text-neutral-950">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────── */}
      {product.category === 'HAIR CARE' && (
        <div className="bg-white border-b border-[#EAEAEA]">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-10 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left: heading + brief context */}
              <div className="lg:col-span-4">
                <h2
                  className="text-2xl text-neutral-950 font-bold leading-[1.25] tracking-[-0.01em] mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Common questions answered
                </h2>
                <p className="text-sm text-neutral-700 leading-[1.75]">
                  Answers to the questions we hear most often from customers across India before their first purchase.
                </p>
              </div>

              {/* Right: accordion */}
              <div className="lg:col-span-8">
                {FAQS.map((faq, i) => {
                  const open = faqOpen === i;
                  return (
                    <div key={i} className="border-b border-[#EAEAEA]">
                      <button
                        type="button"
                        onClick={() => setFaqOpen(open ? null : i)}
                        className="w-full flex items-center justify-between py-5 text-left gap-6 cursor-pointer"
                      >
                        <span className="text-sm font-bold text-neutral-900">{faq.q}</span>
                        <span className="text-lg text-[#8b6d43] font-bold flex-shrink-0 leading-none select-none w-4 text-center">
                          {open ? '−' : '+'}
                        </span>
                      </button>
                      {open && (
                        <p className="text-sm text-neutral-800 leading-[1.8] pb-5">{faq.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOMMENDED FORMULATIONS (ABOVE REVIEWS) ─────────────────── */}
      {recommendations.length > 0 && (
        <section className="bg-[#FAF8F5] border-t border-b border-[#E8E1D5] py-14 sm:py-16">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E1D5] mb-9">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F0EAE1] border border-[#DDD4C7] mb-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B6D43]" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#8B6D43] font-bold">
                    Prescribed Complements &bull; Layering Sequence
                  </p>
                </div>
                <h2
                  className="text-2xl sm:text-3xl text-neutral-950 font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Recommended Formulations
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="text-xs font-mono uppercase tracking-wider text-[#8B6D43] hover:text-neutral-950 font-bold inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
              >
                <span>Complete Dispensary</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Recommendation Grid - Same Cards As Shop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => {
                const isAdded = addedRecId === rec.id;
                const displayImg = rec.image3D || rec.image;
                const priceData = toInr(rec.price);

                return (
                  <div
                    key={String(rec.id)}
                    className="group flex flex-col bg-[#fbfbf8] border border-[#d2c2ad] rounded-[1.75rem] p-4 sm:p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative w-full"
                  >
                    {rec.badge && (
                      <span className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[9px] font-bold tracking-widest uppercase shadow-sm">
                        {rec.badge}
                      </span>
                    )}
                    <div
                      onClick={() => {
                        onNavigate('product', { id: String(rec.id) });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-[#f4efe6] mb-4 relative flex items-center justify-center p-5 cursor-pointer"
                    >
                      <img
                        src={displayImg}
                        alt={rec.name}
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
                          onClick={() => {
                            onNavigate('product', { id: String(rec.id) });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-neutral-900 text-base font-serif font-bold tracking-wide uppercase mb-1 line-clamp-1 hover:text-[#8b6d43] transition-colors cursor-pointer"
                        >
                          {rec.name}
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
                            {rec.inStock !== false ? 'In stock' : 'Low stock'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(rec, 1);
                          setAddedRecId(rec.id);
                          setTimeout(() => setAddedRecId(null), 1800);
                        }}
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
        </section>
      )}

      {/* ── REVIEWS ─────────────────────────────────── */}
      {product.category === 'HAIR CARE' && (
        <div className="bg-[#F7F6F3] border-b border-[#EAEAEA]">

        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-10 sm:py-12">
          {/* Header row */}
          <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#8b6d43] font-bold mb-2">Customer reviews</p>
              <div className="flex items-baseline gap-4">
                <span
                  className="text-[3.5rem] text-neutral-950 font-bold leading-none"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  4.9
                </span>
                <div>
                  <div className="flex text-[#8b6d43] mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-xs text-neutral-700 font-semibold">out of 5 · {reviews.length + 38} reviews</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'verified'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setReviewFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded border cursor-pointer transition-colors font-medium ${
                    reviewFilter === f
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white border-[#d2c2ad]/70 text-neutral-700 hover:border-neutral-950'
                  }`}
                >
                  {f === 'all' ? 'All reviews' : 'Verified buyers'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setWriteOpen(!writeOpen)}
                className="text-xs px-3.5 py-1.5 rounded-lg border border-[#8b6d43] bg-white text-[#8b6d43] font-bold hover:bg-[#8b6d43] hover:text-white cursor-pointer transition-colors"
              >
                Write a review
              </button>
            </div>
          </div>

          {/* Write form */}
          {writeOpen && (
            <div className="bg-white border border-[#d2c2ad]/60 rounded-xl p-6 sm:p-7 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-neutral-950">Your review</h3>
                <button type="button" onClick={() => setWriteOpen(false)} className="text-neutral-500 hover:text-neutral-950 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {rSuccess ? (
                <p className="text-sm font-semibold text-emerald-800">Review submitted. Thank you.</p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">Name *</label>
                      <input
                        required
                        value={rForm.author}
                        onChange={(e) => setRForm({ ...rForm, author: e.target.value })}
                        placeholder="Priya R."
                        className="w-full h-9 px-3 text-sm rounded-lg border border-[#d2c2ad]/80 bg-[#fbfbf8] text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">City</label>
                      <input
                        value={rForm.location}
                        onChange={(e) => setRForm({ ...rForm, location: e.target.value })}
                        placeholder="Chennai"
                        className="w-full h-9 px-3 text-sm rounded-lg border border-[#d2c2ad]/80 bg-[#fbfbf8] text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} type="button" onClick={() => setRForm({ ...rForm, rating: s })} className="cursor-pointer">
                          <Star className={`w-5 h-5 ${s <= rForm.rating ? 'fill-[#8b6d43] text-[#8b6d43]' : 'text-neutral-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">Headline *</label>
                    <input
                      required
                      value={rForm.title}
                      onChange={(e) => setRForm({ ...rForm, title: e.target.value })}
                      placeholder="Brief summary"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-[#d2c2ad]/80 bg-[#fbfbf8] text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">Your experience *</label>
                    <textarea
                      required
                      rows={4}
                      value={rForm.content}
                      onChange={(e) => setRForm({ ...rForm, content: e.target.value })}
                      placeholder="Describe the texture, results, and how long you have been using it."
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#d2c2ad]/80 bg-[#fbfbf8] text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-[#8b6d43] resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-6 rounded-lg bg-[#8b6d43] hover:bg-[#725936] text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-sm"
                  >
                    Submit review
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Review list */}
          <div className="space-y-3">
            {filtered.map((rev) => {
              const voted = !!helpfulVoted[rev.id];
              return (
                <article key={rev.id} className="bg-white border border-[#d2c2ad]/60 rounded-xl px-6 py-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex text-[#8b6d43]">
                        {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                      <span className="text-sm font-bold text-neutral-950">{rev.author}</span>
                      <span className="text-xs text-neutral-600 font-medium">{rev.location}</span>
                      {rev.verified && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 font-medium">{rev.date}</span>
                  </div>
                  <p className="text-sm font-bold text-neutral-950 mb-1.5">{rev.title}</p>
                  <p className="text-sm text-neutral-800 leading-[1.75] mb-4">{rev.content}</p>
                  <button
                    type="button"
                    onClick={() => handleHelpful(rev.id)}
                    disabled={voted}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors font-medium ${
                      voted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                        : 'bg-white border-[#d2c2ad]/70 text-neutral-700 hover:border-neutral-950'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({rev.helpfulCount})</span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>

      </div>
      )}
    </div>
  );
};
