import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle, Truck, RefreshCw, ShieldCheck, Mail } from 'lucide-react';

interface FaqPageProps {
  onNavigate: (page: string) => void;
}

interface FaqItem {
  q: string;
  a: string;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<'shipping' | 'products' | 'returns' | 'payments'>('shipping');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqData: Record<string, FaqItem[]> = {
    shipping: [
      {
        q: 'How fast do you dispatch orders from the apothecary?',
        a: 'Every JASS remedy is prepared and hand-inspected in our apothecary laboratory. Orders placed before 1:00 PM IST are dispatched within 24 hours. Standard Express delivery takes 3–5 business days nationwide, while Priority Express arrives in 1–2 business days.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes, we provide complimentary Standard Express Eco Shipping on all orders valued at $75.00 or more. For orders below $75.00, a flat nominal delivery fee of $9.99 applies.',
      },
      {
        q: 'Do you ship in eco-friendly protective packaging?',
        a: 'Absolutely. We use 100% biodegradable corrugated cardboard cushioning, water-activated paper tape, and recyclable amber glass bottles to ensure zero plastic waste reaches our oceans.',
      },
      {
        q: 'Can I track my parcel in real time?',
        a: 'Yes, upon courier collection, an automated tracking ID and link are delivered to your email address and SMS. You can also track your parcel directly using our on-site Track Order page.',
      },
    ],
    products: [
      {
        q: 'Are JASS Products formulated according to authentic Ayurvedic classical texts?',
        a: 'Yes. Our Master Herbalists formulate strictly adhering to classical Ayurvedic samhitas (Charaka & Sushruta Samhitas). We prioritize natural biological synergy, combining wild-harvested botanicals such as Amla, Bhringraj, Ashwagandha, and Brahmi.',
      },
      {
        q: 'What is the shelf life of your cold-pressed botanicals?',
        a: 'Because our formulations are free from harsh chemical preservatives, they maintain optimal bio-potency for 18 months from the batch date. We recommend storing all bottles in a cool, dry place away from direct sunlight.',
      },
      {
        q: 'Are your formulations safe for sensitive scalp and skin types?',
        a: 'Yes. All JASS formulations undergo rigorous dermatological patch testing and are 100% free of sulfates, artificial fragrance, parabens, and phthalates. We nevertheless advise performing a 24-hour small patch test on the inner forearm prior to full application.',
      },
      {
        q: 'Are any animal testing methods utilized?',
        a: 'Never. JASS Products is certified Cruelty-Free and Vegan. We love all living beings and never test ingredients or finished formulas on animals.',
      },
    ],
    returns: [
      {
        q: 'What is your 30-Day Ritual Satisfaction Guarantee?',
        a: 'We are completely confident in the transformative potency of our Ayurvedic remedies. If you are not entirely satisfied with your experience within 30 days of receipt, contact our concierge for an immediate full exchange or refund.',
      },
      {
        q: 'How do I initiate a return or exchange?',
        a: 'Simply email our concierge team at care@jassproducts.com with your Order Reference ID (e.g. JP-89214). We will provide a pre-paid return shipping label and arrange complimentary courier pickup from your home.',
      },
      {
        q: 'How long do refunds take to process back to my account?',
        a: 'Once the returned package reaches our apothecary hub, your refund is credited within 3–5 business days to your original payment method.',
      },
    ],
    payments: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major secure prepaid digital payment options via our 256-bit encrypted Razorpay gateway: UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), and NetBanking. To maintain cold-chain purity and prevent automated order flooding/fake addresses, Cash on Delivery (COD) is strictly not accepted.',
      },
      {
        q: 'Is my credit card and personal data secure?',
        a: 'All payment information is processed via PCI-DSS Level 1 certified banking encryption. We never store credit card numbers or banking secrets on our servers.',
      },
      {
        q: 'How do I redeem promotional coupon codes like WELCOME10?',
        a: 'During checkout or within the Cart Drawer, enter your coupon code into the Promo Code field and click "Apply". The discount will immediately reflect in your order subtotal.',
      },
    ],
  };

  const categories = [
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'products', label: 'Ayurveda & Products', icon: Sparkles },
    { id: 'returns', label: 'Returns & Guarantee', icon: RefreshCw },
    { id: 'payments', label: 'Payment & Security', icon: ShieldCheck },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 max-w-[1200px] mx-auto min-h-[75vh]">
      {/* Header Banner */}
      <div className="w-full text-center py-12 md:py-16 bg-[#f4f1ea] rounded-[2.5rem] border border-[#d2c2ad]/40 mb-12 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] text-xs font-bold tracking-[0.2em] uppercase mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Concierge Help Center</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-neutral-900 mb-4 tracking-wide">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Clear guidance regarding our Ayurvedic botanical preparations, express dispatch timelines, and our 30-day ritual satisfaction guarantee.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-10 w-full">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id as any);
                setOpenIndex(0);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-[#8b6d43] text-white shadow-md'
                  : 'bg-[#fbfbf9] text-neutral-700 hover:bg-[#ebe3d5] border border-[#d2c2ad]/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion List */}
      <div className="w-full max-w-3xl space-y-4 mb-16">
        {faqData[activeCategory].map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#d2c2ad]/50 overflow-hidden shadow-2xs transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50"
              >
                <span className="font-serif font-bold text-neutral-900 text-sm sm:text-base leading-snug">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#8b6d43] flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions Box */}
      <div className="w-full max-w-3xl p-8 bg-[#fbfbf9] rounded-3xl border border-[#d2c2ad]/50 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-900 mb-1">
            Need Personal Guidance from Our Herbalists?
          </h3>
          <p className="text-xs text-neutral-600">
            Our concierge team is available Monday through Saturday to answer specific queries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="px-6 py-3 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold tracking-widest uppercase transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          Contact Herbalist
        </button>
      </div>
    </div>
  );
};
