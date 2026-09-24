import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, Edit2, Trash2, Power, ExternalLink } from "lucide-react";
import {
  getStoredAdminBanners,
  saveStoredAdminBanners,
} from "../../../features/admin/store/admin-store.ts";
import type { HeroBannerRecord } from "../../../types/admin.ts";

interface BannersViewProps {
  onOpenAddBanner: () => void;
  onEditBanner: (banner: HeroBannerRecord) => void;
}

export const BannersView: React.FC<BannersViewProps> = ({
  onOpenAddBanner,
  onEditBanner,
}) => {
  const [banners, setBanners] = useState<HeroBannerRecord[]>([]);

  const loadData = () => {
    setBanners(getStoredAdminBanners());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("banners_updated", loadData);
    return () => window.removeEventListener("banners_updated", loadData);
  }, []);

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    saveStoredAdminBanners(updated);
    setBanners(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this promotional banner?")) {
      const updated = banners.filter((b) => b.id !== id);
      saveStoredAdminBanners(updated);
      setBanners(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Banner Showcase & Merchandising
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Control promotional announcement cards, hero sliders, and seasonal campaign visuals.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddBanner}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="h-48 relative bg-neutral-900 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-75"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/img-2.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D2C2AD] font-semibold">
                    {banner.placement}
                  </span>
                  <h3 className="font-serif font-bold text-white text-lg leading-tight mt-0.5">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 mt-1">{banner.subtitle}</p>
                </div>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#2D2A26]/60">CTA Button:</span>
                  <span className="font-semibold text-[#8B6D43]">{banner.ctaText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2D2A26]/60">Target Link:</span>
                  <span className="font-mono text-[11px] text-[#2D2A26]">{banner.ctaLink}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E1D5] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleToggleActive(banner.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  banner.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-neutral-100 text-neutral-600 border border-neutral-300"
                }`}
              >
                <Power className="h-3 w-3" />
                <span>{banner.active ? "Active" : "Disabled"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditBanner(banner)}
                  className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
                  title="Edit Banner"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
