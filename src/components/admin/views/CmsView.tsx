import React, { useState, useEffect } from "react";
import { Save, Check, Megaphone, FileText, Store } from "lucide-react";
import {
  getStoredCmsConfig,
  saveStoredCmsConfig,
} from "../../../features/admin/store/admin-store.ts";
import type { StorefrontCmsConfig } from "../../../types/admin.ts";

export const CmsView: React.FC = () => {
  const [config, setConfig] = useState<StorefrontCmsConfig>(getStoredCmsConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setConfig(getStoredCmsConfig());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredCmsConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Storefront CMS & Announcement Customizer
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Edit header marquee tickers, brand taglines, hero headlines, and customer support channels.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>CMS settings updated!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Announcement Bar */}
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#8B6D43]" />
              <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
                Top Storefront Announcement Bar
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={config.announcementBarActive}
                onChange={(e) =>
                  setConfig({ ...config, announcementBarActive: e.target.checked })
                }
                className="rounded accent-[#8B6D43]"
              />
              <span>Active</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Announcement Message
            </label>
            <input
              type="text"
              value={config.announcementBarText}
              onChange={(e) =>
                setConfig({ ...config, announcementBarText: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>
        </div>

        {/* Hero Section Copy */}
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8E1D5] pb-3">
            <Store className="h-4 w-4 text-[#8B6D43]" />
            <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
              Storefront Hero Masthead & Positioning
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Hero Display Headline
            </label>
            <input
              type="text"
              value={config.heroHeadline}
              onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs font-serif text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Hero Botanical Sub-headline
            </label>
            <textarea
              rows={2}
              value={config.heroSubheadline}
              onChange={(e) => setConfig({ ...config, heroSubheadline: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Footer Apothecary Tagline
            </label>
            <input
              type="text"
              value={config.footerTagline}
              onChange={(e) => setConfig({ ...config, footerTagline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>
        </div>

        {/* Contact & Free Shipping */}
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8E1D5] pb-3">
            <FileText className="h-4 w-4 text-[#8B6D43]" />
            <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
              Apothecary Dispensary Contact Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Dispensary Phone Helpline
              </label>
              <input
                type="text"
                value={config.contactPhone}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Free Pan-India Delivery Threshold (₹)
            </label>
            <input
              type="number"
              value={config.freeShippingAbove}
              onChange={(e) =>
                setConfig({ ...config, freeShippingAbove: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save Storefront CMS Settings</span>
        </button>
      </form>
    </div>
  );
};
