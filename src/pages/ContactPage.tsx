import React, { useState, useRef } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'product-recommendation',
    orderNumber: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.gsap-contact-header',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-contact-form',
        { opacity: 0, x: -25 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-contact-form',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.gsap-contact-info',
        { opacity: 0, x: 25 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-contact-info',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: contactRef }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div ref={contactRef} className="w-full flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <div className="gsap-contact-header w-full text-center py-12 md:py-16 bg-[#f4f1ea] rounded-[2.5rem] border border-[#d2c2ad]/40 mb-12 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] text-xs font-bold tracking-[0.2em] uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apothecary Concierge</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-neutral-900 mb-4 tracking-wide">
          Connect With Our Herbalists
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Whether you require bespoke Ayurvedic dosha consultations, product usage advice, or order assistance, our dedicated team is here to guide your ritual.
        </p>
      </div>

      {/* Main Contact Grid (Form on left, Info on right) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-16">
        {/* Left Column: Form (7 cols) */}
        <div className="gsap-contact-form lg:col-span-7 bg-white rounded-3xl border border-[#d2c2ad]/50 p-6 sm:p-10 shadow-sm">
          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-2xl text-neutral-900 mb-2">Message Received</h2>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
                Thank you, <strong>{formData.name}</strong>. An herbalist concierge has received your inquiry and will respond within 24 business hours to <strong>{formData.email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    subject: 'product-recommendation',
                    orderNumber: '',
                    message: '',
                  });
                }}
                className="px-6 py-2.5 rounded-full bg-[#8b6d43] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya Sen"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. maya@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Nature of Inquiry
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#8b6d43] cursor-pointer"
                  >
                    <option value="product-recommendation">Dosha / Product Recommendation</option>
                    <option value="order-support">Order Assistance & Delivery</option>
                    <option value="wholesale">Wholesale & Spa Distribution</option>
                    <option value="press">Press & Botanical Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    placeholder="e.g. JP-89214"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#8b6d43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Your Message / Consultation Request *
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share details regarding your skin or hair type, concerns, or specific questions..."
                  className="w-full p-4 rounded-2xl border border-neutral-300 bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#8b6d43] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Transmitting Note...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Information Cards (5 cols) */}
        <div className="gsap-contact-info lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#fbfbf9] border border-[#d2c2ad]/40 shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-bold text-neutral-900 tracking-wide uppercase">
              Direct Channels
            </h3>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8b6d43] uppercase block">
                  Concierge Email
                </span>
                <a
                  href="mailto:care@jassproducts.com"
                  className="text-xs font-medium text-neutral-800 hover:text-[#8b6d43] transition-colors"
                >
                  care@jassproducts.com
                </a>
                <p className="text-[11px] text-neutral-500 mt-0.5">Average response: &lt; 6 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8b6d43] uppercase block">
                  Apothecary Helpline
                </span>
                <span className="text-xs font-medium text-neutral-800">+91 (0) 800-JASS-VEDA</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">Toll-free customer guidance</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8b6d43] uppercase block">
                  Concierge Hours
                </span>
                <span className="text-xs font-medium text-neutral-800">
                  Monday – Saturday: 9:00 AM – 7:00 PM IST
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">Closed Sundays & Lunar Observances</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b6d43]/10 text-[#8b6d43] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8b6d43] uppercase block">
                  Studio Headquarters
                </span>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Heritage Botanical House, Veda Way, Indiranagar, Bengaluru, KA 560038, India
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ shortcut */}
          <div className="p-6 rounded-3xl bg-[#f4f1ea] border border-[#d2c2ad]/40 flex items-center justify-between">
            <div>
              <h4 className="font-serif text-sm font-bold text-neutral-900">Seeking Quick Answers?</h4>
              <p className="text-[11px] text-neutral-600">Review our shipping & product FAQs.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('faq')}
              className="px-4 py-2 rounded-full bg-white border border-[#d2c2ad] text-neutral-800 text-xs font-bold uppercase tracking-wider hover:bg-[#8b6d43] hover:text-white transition-colors cursor-pointer"
            >
              View FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
