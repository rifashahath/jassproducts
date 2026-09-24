import React, { useState, useRef } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.gsap-footer-col',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: footerRef }
  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    onNavigate(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (


    <footer ref={footerRef} className="w-full bg-[#151413] text-[#ebe3d5] pt-20 pb-12 px-6 sm:px-10 md:px-14 mt-0 border-t border-[#2e2a26]">
      <div className="max-w-[1400px] mx-auto">
        {/* Giant Masthead */}
        <div className="pb-12 border-b border-[#2e2a26] mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#8b6d43] font-semibold block mb-2">
              Authentic Botanical Dispensary
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#f9f8f4] tracking-tight">
              JASS AYURVEDA
            </h2>
          </div>
          <div className="max-w-xs text-xs text-[#ebe3d5]/60 leading-relaxed uppercase tracking-wider">
            Crafted in Karnataka & Tamil Nadu for Indian hair and scalp resilience against borewell hard water.
          </div>
        </div>

        {/* 4 Clean Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-16 border-b border-[#2e2a26]">
          {/* Col 1 */}
          <div>
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#f9f8f4] mb-4">Apothecary</h4>
            <ul className="space-y-3 text-sm text-[#ebe3d5]/70">
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'categories')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Shop All Collection
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'categories')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Cold-Pressed Hair Oils
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'categories')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Herbal Soap Bars
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'categories')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Kesh Kalp Powder
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#f9f8f4] mb-4">Philosophy</h4>
            <ul className="space-y-3 text-sm text-[#ebe3d5]/70">
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'about')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Our Botanical Heritage
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'about')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Vedic Extraction Principles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'about')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Borewell Hard Water Science
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#f9f8f4] mb-4">Assistance</h4>
            <ul className="space-y-3 text-sm text-[#ebe3d5]/70">
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'track-order')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Track Your Delivery
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'faq')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  FAQ & Shipping Times
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, 'contact')}
                  className="hover:text-[#8b6d43] transition-colors cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  WhatsApp Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#f9f8f4] mb-3">Dispensary Letter</h4>
            <p className="text-xs text-[#ebe3d5]/60 mb-4 leading-relaxed">
              Join our quiet community for seasonal harvest notices and Ayurvedic care bulletins.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscribed</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                  className="bg-[#201d1b] border border-[#3a3530] rounded-lg px-3.5 py-2 text-xs text-[#f9f8f4] placeholder:text-[#ebe3d5]/40 outline-none focus:border-[#8b6d43]"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-[#8b6d43] hover:bg-[#9e7c4d] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#ebe3d5]/40">
          <p>&copy; {new Date().getFullYear()} Jass Products. Pure Botanical Formulations.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={(e) => handleLinkClick(e, 'policies')}
              className="hover:text-[#ebe3d5] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={(e) => handleLinkClick(e, 'policies')}
              className="hover:text-[#ebe3d5] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={(e) => handleLinkClick(e, 'admin')}
              className="hover:text-[#8b6d43] text-[#8b6d43] font-mono transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Apothecary Console
            </button>
          </div>
        </div>
      </div>
    </footer>


  );
};
