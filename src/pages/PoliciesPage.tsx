import React, { useState } from 'react';
import { ShieldCheck, FileText, Sparkles } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="w-full flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 max-w-[1000px] mx-auto min-h-[75vh]">
      {/* Header */}
      <div className="w-full text-center py-12 bg-[#f4f1ea] rounded-[2.5rem] border border-[#d2c2ad]/40 mb-10 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] text-xs font-bold tracking-[0.2em] uppercase mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Apothecary Governance</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 mb-3 tracking-wide">
          Legal & Privacy Policies
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
          Transparent guidelines protecting your privacy, security, and purchasing rights at JASS Products.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#d2c2ad]/40 mb-8 w-full justify-center">
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 font-serif text-sm sm:text-base font-bold tracking-wide uppercase cursor-pointer border-b-2 transition-colors ${
            activeTab === 'privacy'
              ? 'border-[#8b6d43] text-[#8b6d43]'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`pb-3 font-serif text-sm sm:text-base font-bold tracking-wide uppercase cursor-pointer border-b-2 transition-colors ${
            activeTab === 'terms'
              ? 'border-[#8b6d43] text-[#8b6d43]'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          Terms of Service
        </button>
      </div>

      {/* Policy Content */}
      <div className="w-full bg-white rounded-3xl border border-[#d2c2ad]/50 p-6 sm:p-10 shadow-sm text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-6">
        {activeTab === 'privacy' ? (
          <>
            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                1. Information Collection & Usage
              </h2>
              <p>
                JASS Products values your sanctuary and privacy. We collect personal details strictly to fulfill your orders, provide shipment tracking notifications, and respond to concierge inquiries. We never monetize, rent, or sell your personal data to third-party marketing brokers under any circumstance.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                2. Payment Security
              </h2>
              <p>
                All financial transactions are encrypted via PCI-DSS Level 1 certified gateways (Razorpay). Sensitive card numbers, UPI credentials, and banking passwords are never transmitted to or held on JASS servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                3. Cookies & Session Preferences
              </h2>
              <p>
                We use secure first-party session cookies exclusively to retain items in your shopping bag, preserve promotional discounts, and deliver optimal device layouts.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                1. Apothecary Formulations & Patch Tests
              </h2>
              <p>
                While our remedies are 100% natural and cold-pressed without synthetic additives, botanical active botanicals carry inherent bio-activity. Customers are advised to review all ingredient lists and conduct a 24-hour forearm patch test prior to full application.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                2. Shipping & Title of Goods
              </h2>
              <p>
                Risk of loss and title for items purchased pass to you upon our delivery to the express shipping carrier. If a parcel is damaged in transit, our concierge will issue an expedited complimentary replacement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                3. Satisfaction Guarantee & Returns
              </h2>
              <p>
                All customers enjoy our 30-Day Ritual Guarantee. If a formula does not meet your expectations, return the remaining bottle within 30 days of receipt for a full refund or exchange.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide">
                4. Strict 100% Prepaid Order Policy (Zero COD)
              </h2>
              <p>
                To maintain the chemical-free integrity of fresh small-batch Ayurvedic concoctions, ensure immediate carrier dispatch, and eliminate automated bot flooding or counterfeit addresses, JASS Products operates exclusively on a verified prepaid basis. Cash on Delivery (COD) is strictly prohibited.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
