import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Check, Smartphone, Monitor } from "lucide-react";
import type { HeroBannerRecord } from "../../../types/admin.ts";

interface BannerFormModalProps {
  open: boolean;
  banner?: HeroBannerRecord | null;
  onClose: () => void;
  onSave: (data: Partial<HeroBannerRecord>) => void;
}

export const BannerFormModal: React.FC<BannerFormModalProps> = ({
  open,
  banner,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("Explore Collection");
  const [ctaLink, setCtaLink] = useState("#categories");
  const [imageUrl, setImageUrl] = useState("/img-2.png");
  const [placement, setPlacement] = useState<HeroBannerRecord["placement"]>("HERO_MAIN");
  const [active, setActive] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (banner) {
      setTitle(banner.title);
      setSubtitle(banner.subtitle);
      setCtaText(banner.ctaText);
      setCtaLink(banner.ctaLink);
      setImageUrl(banner.imageUrl);
      setPlacement(banner.placement);
      setActive(banner.active);
    } else {
      setTitle("");
      setSubtitle("");
      setCtaText("Explore Collection");
      setCtaLink("#categories");
      setImageUrl("/img-2.png");
      setPlacement("HERO_MAIN");
      setActive(true);
    }
  }, [banner, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: banner?.id,
      title,
      subtitle,
      ctaText,
      ctaLink,
      imageUrl,
      placement,
      active,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/60 flex items-center justify-center text-[#8B6D43]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                {banner ? "Edit Promotional Showcase" : "Create Promotional Banner"}
              </h3>
              <p className="text-[11px] font-mono text-[#8B6D43] uppercase tracking-wider">
                Storefront Merchandising
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#2D2A26]/50 hover:text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Banner Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hard Water Defense Rituals"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Subtitle / Botanical Copy
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Describe the offer, formulation highlights, or harvest note..."
              className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Call to Action Label
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Explore Collection"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Call to Action Link
              </label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="#categories?category=HAIR CARE"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Banner Placement
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as HeroBannerRecord["placement"])}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              >
                <option value="HERO_MAIN">HERO MAIN (Top Canvas)</option>
                <option value="MID_PAGE_STRIP">MID PAGE STRIP (Between Sections)</option>
                <option value="CATEGORY_HEADER">CATEGORY HEADER (Catalog Page)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Display Status
              </label>
              <select
                value={active ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setActive(e.target.value === "ACTIVE")}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              >
                <option value="ACTIVE">ACTIVE (Displaying on Storefront)</option>
                <option value="INACTIVE">INACTIVE (Hidden / Draft)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Image Asset Path
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/img-2.png or /image.png"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          {/* Live Device Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6D43]">
                Live Showcase Preview
              </span>
              <div className="flex items-center gap-1 border border-[#D2C2AD]/70 rounded-lg p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1 rounded ${previewDevice === "desktop" ? "bg-[#8B6D43] text-white" : "text-[#2D2A26]/50"}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1 rounded ${previewDevice === "mobile" ? "bg-[#8B6D43] text-white" : "text-[#2D2A26]/50"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className={`mx-auto rounded-2xl overflow-hidden border border-[#D2C2AD] relative bg-neutral-900 ${previewDevice === "mobile" ? "max-w-xs h-48" : "w-full h-44"}`}>
              <img
                src={imageUrl}
                alt="Banner preview"
                className="w-full h-full object-cover opacity-70"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/img-2.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <h4 className="font-serif text-white font-bold text-base sm:text-lg leading-tight">
                  {title || "Hard Water Defense Rituals"}
                </h4>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  {subtitle || "Cold-pressed rosemary and neem solutions..."}
                </p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-[#8B6D43] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {ctaText || "Explore Collection"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#2D2A26]/70 hover:text-[#2D2A26] hover:bg-[#F4EFE6] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Save Banner</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
