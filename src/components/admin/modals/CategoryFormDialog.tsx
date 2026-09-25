import React, { useState, useEffect } from "react";
import { X, Layers, Check } from "lucide-react";
import type { CategoryItem } from "../../../types/admin.ts";

interface CategoryFormDialogProps {
  open: boolean;
  categoryItem?: CategoryItem | null;
  onClose: () => void;
  onSave: (data: Partial<CategoryItem>) => void;
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  categoryItem,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("/products/herbal-shampoo/main.png");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<CategoryItem["status"]>("ACTIVE");

  useEffect(() => {
    if (categoryItem) {
      setName(categoryItem.name || "");
      setSlug(categoryItem.slug || "");
      setDescription(categoryItem.description || "");
      setImage(categoryItem.image || "/products/herbal-shampoo/main.png");
      setDisplayOrder(categoryItem.displayOrder || 1);
      setStatus(categoryItem.status || "ACTIVE");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setImage("/products/herbal-shampoo/main.png");
      setDisplayOrder(1);
      setStatus("ACTIVE");
    }
  }, [categoryItem, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: categoryItem?.id,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description,
      image,
      displayOrder: Number(displayOrder),
      status,
    });
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

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/60 flex items-center justify-center text-[#8B6D43]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                {categoryItem ? "Edit Category" : "Add Botanical Category"}
              </h3>
              <p className="text-[11px] font-mono text-[#8B6D43] uppercase tracking-wider">
                Dispensary Taxonomy
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!categoryItem) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
              placeholder="e.g. HAIR CARE"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hair-care"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this category's Ayurvedic focus..."
              className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Featured Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/products/herbal-shampoo/main.png"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            >
              <option value="ACTIVE">ACTIVE (Published to Store)</option>
              <option value="INACTIVE">INACTIVE (Hidden)</option>
            </select>
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
              <span>Save Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
