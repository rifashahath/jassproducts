import React, { useRef } from 'react';
import { Sparkles, Leaf, ShieldCheck, Heart, Award, ArrowRight, Compass, Sun } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const aboutRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.gsap-about-hero',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-about-story',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-about-story',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.gsap-about-pillar',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-about-pillars',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: aboutRef }
  );

  return (
    <div ref={aboutRef} className="w-full flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
      {/* Hero Header */}
      <div className="gsap-about-hero w-full text-center py-12 md:py-16 bg-gradient-to-b from-[#f4f1ea] via-[#FAF9F6] to-[#ebe3d5]/50 rounded-[2.5rem] border border-[#d2c2ad]/40 mb-14 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto z-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b6d43]/10 border border-[#8b6d43]/20 mb-4 text-xs font-bold tracking-[0.25em] text-[#8b6d43] uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Jass Heritage</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-neutral-900 mb-6 tracking-tight leading-tight">
            Sacred Botanical Wisdom, Refined by Science
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-light max-w-2xl mx-auto">
            At JASS Products, we revive 5,000 years of classical Ayurvedic science, hand-crafting small-batch remedies that awaken your natural biological vitality.
          </p>
        </div>
      </div>

      {/* Origin Story Grid (2 Columns) */}
      <div className="gsap-about-story w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
        <div className="relative">
          <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-b from-[#ebe3d5] to-[#f4f1ea] border border-[#d2c2ad]/50 shadow-xl relative p-4 flex items-center justify-center">
            <img
              src="/image.png"
              alt="Jass Herbal Sourcing"
              className="w-full h-full object-cover rounded-2xl filter contrast-[1.05]"
            />
          </div>
          <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white p-5 rounded-2xl border border-[#d2c2ad]/60 shadow-xl max-w-xs">
            <p className="font-serif text-sm font-bold text-neutral-900 mb-1">
              "Ayurveda is the art of living in harmony with nature's rhythm."
            </p>
            <span className="text-[10px] uppercase tracking-widest text-[#8b6d43] font-semibold">
              — Jass Botanical Apothecary
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#8b6d43] uppercase">
            Our Foundation
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 tracking-wide leading-snug">
            Born from a Reverence for Sacred Plant Life
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed font-light">
            Founded with a devotion to purity, JASS Products was created to challenge mass-produced synthetic cosmetics filled with harsh petrochemicals, silicones, and artificial foaming agents.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed font-light">
            We returned to ancient Sanskrit pharmacopeias (*Charaka Samhita* and *Sushruta Samhita*), partnering directly with multigenerational herbal farmers across the Himalayan foothills and Malabar coast. Every herb is harvested by hand in synchronization with seasonal lunar cycles when active phytonutrients peak.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#d2c2ad]/40">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#8b6d43]">100%</h3>
              <p className="text-xs text-neutral-600 uppercase tracking-wider font-semibold mt-0.5">
                Pure Plant Origin
              </p>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#8b6d43]">5,000+</h3>
              <p className="text-xs text-neutral-600 uppercase tracking-wider font-semibold mt-0.5">
                Years of Tradition
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The 4 Sacred Pillars */}
      <div className="w-full mb-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#8b6d43] uppercase tracking-wider mb-2">
            The Pillars of Our Craft
          </h2>
          <p className="text-xs text-neutral-600 uppercase tracking-widest">
            Uncompromising standards across every droplet we bottle
          </p>
        </div>

        <div className="gsap-about-pillars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="gsap-about-pillar p-8 rounded-3xl bg-[#fbfbf9] border border-[#d2c2ad]/50 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center mb-6">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">
              Cold-Pressed Purity
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              We extract plant oils using traditional wooden cold-press expellers, preserving volatile botanical bio-compounds without destructive thermal processing.
            </p>
          </div>

          <div className="gsap-about-pillar p-8 rounded-3xl bg-[#fbfbf9] border border-[#d2c2ad]/50 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center mb-6">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">
              Lunar Harvested
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our wild-crafted botanicals are harvested in alignment with natural biodynamic cycles, capturing maximum vitality and medicinal potency.
            </p>
          </div>

          <div className="gsap-about-pillar p-8 rounded-3xl bg-[#fbfbf9] border border-[#d2c2ad]/50 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">
              Zero Synthetics
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every formula is strictly formulated without parabens, sulfates, microplastics, mineral oils, or synthetic fragrances.
            </p>
          </div>

          <div className="gsap-about-pillar p-8 rounded-3xl bg-[#fbfbf9] border border-[#d2c2ad]/50 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">
              Cruelty-Free & Ethical
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              We never test on animals, uphold fair trade compensation for our farming cooperatives, and bottle exclusively in recyclable glass.
            </p>
          </div>
        </div>
      </div>

      {/* Sustainable Sourcing Journey */}
      <div className="w-full bg-[#1c1b19] text-[#ebe3d5] rounded-[2.5rem] p-8 sm:p-12 md:p-16 mb-16 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#d4af37] uppercase mb-3 block">
            Ethical Stewardship
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-wide mb-4">
            Protecting the Earth that Heals Us
          </h2>
          <p className="text-xs sm:text-sm text-[#ebe3d5]/80 leading-relaxed mb-8">
            For every 100 bottles crafted, we plant indigenous medicinal saplings across community reforestation reserves, securing biodiversity for future generations of natural healers.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="px-8 py-3.5 rounded-full bg-[#8b6d43] hover:bg-[#a68252] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2"
          >
            <span>Explore The Remedies</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
