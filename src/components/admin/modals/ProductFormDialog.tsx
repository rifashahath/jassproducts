import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  Check,
  Percent,
  IndianRupee,
  Layers,
  Sparkles,
  Upload,
  ImageIcon,
  Loader2,
} from "lucide-react";
import type { ExtendedProduct } from "../../../types/admin.ts";
import { getStoredAdminCategories } from "../../../features/admin/store/admin-store.ts";
import { uploadImageFile } from "../../../lib/upload-service.ts";

interface ProductFormDialogProps {
  open: boolean;
  product?: ExtendedProduct | null;
  onClose: () => void;
  onSave: (data: Partial<ExtendedProduct>) => void;
}

type TabKey = "basic" | "pricing" | "inventory" | "media" | "seo" | "specs";

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  product,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const categories = getStoredAdminCategories();

  // Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("HAIR CARE");
  const [price, setPrice] = useState<number>(45);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number>(20);
  const [gstRate, setGstRate] = useState<number>(18);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(15);
  const [image, setImage] = useState("/products/herbal-shampoo/main.webp");
  const [volume, setVolume] = useState("250 ML");
  const [swatchCode, setSwatchCode] = useState("334 U");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // Real Image Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const result = await uploadImageFile(file, "products");
    setIsUploading(false);

    if (result.error || !result.url) {
      setUploadError(result.error || "Failed to upload image.");
    } else {
      setImage(result.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setSku(product.sku || "");
      setCategory(product.category || "HAIR CARE");
      setPrice(product.price || 45);
      setSalePrice(product.salePrice);
      setCostPrice(product.costPrice || 20);
      setGstRate(product.gstRate || 18);
      setStockQuantity(product.stockQuantity || 50);
      setMinStockThreshold(product.minStockThreshold || 15);
      setImage(product.image || "/products/herbal-shampoo/main.webp");
      setVolume(product.volume || "250 ML");
      setSwatchCode(product.swatchCode || "334 U");
      setBadge(product.badge || "");
      setDescription(product.description || "");
      setNote(product.note || "");
      setSeoTitle(product.seoTitle || "");
      setSeoDescription(product.seoDescription || "");
      setSeoKeywords(product.seoKeywords || "");
      setImageAlt((product as any).imageAlt || "");
    } else {
      setName("");
      setSku(`JP-BOT-${Math.floor(100 + Math.random() * 900)}`);
      setCategory("HAIR CARE");
      setPrice(45);
      setSalePrice(undefined);
      setCostPrice(20);
      setGstRate(18);
      setStockQuantity(60);
      setMinStockThreshold(15);
      setImage("/products/herbal-shampoo/main.webp");
      setVolume("250 ML");
      setSwatchCode("334 U");
      setBadge("");
      setDescription("");
      setNote("");
      setSeoTitle("");
      setSeoDescription("");
      setSeoKeywords("");
      setImageAlt("");
    }
  }, [product, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: product?.id,
      name,
      sku,
      category,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      costPrice: Number(costPrice),
      gstRate: Number(gstRate),
      stockQuantity: Number(stockQuantity),
      minStockThreshold: Number(minStockThreshold),
      image,
      volume,
      swatchCode,
      badge: badge || undefined,
      description,
      note,
      seoTitle,
      seoDescription,
      seoKeywords,
      imageAlt,
      inStock: Number(stockQuantity) > 0,
      stockStatus: Number(stockQuantity) <= 0 ? "OUT_OF_STOCK" : Number(stockQuantity) <= Number(minStockThreshold) ? "LOW_STOCK" : "IN_STOCK",
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/60 flex items-center justify-center text-[#8B6D43]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2D2A26]">
                {product ? "Edit Formulation" : "Add New Botanical Product"}
              </h3>
              <p className="text-[11px] font-mono text-[#8B6D43] uppercase tracking-wider">
                {product ? product.sku : "Master Dispensary Catalog"}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8E1D5] bg-[#FAF8F5] px-6 text-xs font-semibold uppercase tracking-wider overflow-x-auto">
          {(
            [
              { key: "basic", label: "Basic Info" },
              { key: "pricing", label: "Pricing & GST" },
              { key: "inventory", label: "Inventory" },
              { key: "media", label: "Media & Packaging" },
              { key: "seo", label: "SEO & Search" },
              { key: "specs", label: "Ayurvedic Ritual" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-[#8B6D43] text-[#8B6D43] font-bold bg-[#FAF9F6]"
                  : "border-transparent text-[#2D2A26]/60 hover:text-[#2D2A26]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Formulation Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anti-Dandruff Shampoo"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Dispensary SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. JP-HA-001"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Apothecary Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe active herbs, extraction process, and hard water defense benefits..."
                  className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Promotional Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Best Seller, Top Rated, Pure Harvest"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Retail Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B6D43]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-semibold text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Sale / Promotional Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B6D43]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={salePrice ?? ""}
                      onChange={(e) =>
                        setSalePrice(e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="Optional discount price"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-semibold text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Formulation Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                  <span className="text-[10px] text-[#8B6D43] mt-1 block">
                    Calculated gross margin: {price > 0 ? Math.round(((price - costPrice) / price) * 100) : 0}%
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    GST Tax Slab (%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Basic Ayurvedic Powders)</option>
                    <option value={12}>12% (Medicinal Oils)</option>
                    <option value={18}>18% (Standard Cosmetics & Skincare)</option>
                    <option value={28}>28% (Luxury Aromatics)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Stock Quantity on Hand *
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Low Stock Reorder Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={minStockThreshold}
                    onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                  <span className="text-[10px] text-[#2D2A26]/50 mt-1 block">
                    Trigger alert when inventory dips below this count.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              {/* Real Cloud Image Uploader */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Product Photograph / Formulation Asset
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    isUploading
                      ? "border-[#8B6D43] bg-[#8B6D43]/5"
                      : "border-[#D2C2AD] hover:border-[#8B6D43] hover:bg-[#FAF9F6] bg-white"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="h-7 w-7 text-[#8B6D43] animate-spin" />
                      <span className="text-xs font-semibold text-[#8B6D43]">
                        Uploading to Supabase Storage...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-center text-[#8B6D43]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#2D2A26] block">
                          Click to upload product image from computer
                        </span>
                        <span className="text-[11px] text-[#2D2A26]/50">
                          PNG, JPG, or WebP up to 10MB • Auto-syncs to cloud CDN
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Image successfully uploaded and bound to formulation!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Direct Asset URL or Path
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/products/herbal-shampoo/main.webp or https://..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Volume / Net Weight
                  </label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="e.g. 250 ML or 100 G"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Pantone Swatch Code
                  </label>
                  <input
                    type="text"
                    value={swatchCode}
                    onChange={(e) => setSwatchCode(e.target.value)}
                    placeholder="e.g. 334 U"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  />
                </div>
              </div>

              {image && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl flex items-center gap-3">
                  <img
                    src={image}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg bg-white border border-[#D2C2AD]/40 shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/products/herbal-shampoo/main.webp";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#2D2A26] block">Active Visual Asset</span>
                    <span className="text-[11px] text-[#8B6D43] truncate block font-mono">{image}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Page / Meta Title (SEO Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Beetroot Lip Balm – Natural Lip Care | Jass Products"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="e.g. Buy Beetroot Lip Balm online: natural lip balm for soft lips..."
                  className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Target Search Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="e.g. beetroot lip balm, natural lip balm, pink lip balm"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Image Alt Text (Screen Readers & Google Images)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. Jass Products Beetroot Lip Balm"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Botanical Extraction & Daily Ritual Note
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Apply 4-5 drops onto cleansed scalp before sleeping..."
                  className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-end gap-3">
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
              <span>Save Formulation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
