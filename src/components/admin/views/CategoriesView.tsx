import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Package,
} from "lucide-react";
import {
  getStoredAdminCategories,
  getStoredAdminProducts,
  deleteCategory,
} from "../../../features/admin/store/admin-store.ts";
import type { CategoryItem } from "../../../types/admin.ts";

interface CategoriesViewProps {
  onOpenAddCategory: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onNavigate: (path: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onOpenAddCategory,
  onEditCategory,
  onNavigate,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState([]);
  const [deletingCat, setDeletingCat] = useState<CategoryItem | null>(null);

  const loadData = () => {
    const cats = getStoredAdminCategories();
    const prods = getStoredAdminProducts();
    setCategories(
      cats.map((c) => ({
        ...c,
        productCount: prods.filter((p) => p.category.toUpperCase() === c.name.toUpperCase())
          .length,
      }))
    );
    setProducts(prods as never);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("categories_updated", loadData);
    window.addEventListener("products_updated", loadData);
    return () => {
      window.removeEventListener("categories_updated", loadData);
      window.removeEventListener("products_updated", loadData);
    };
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingCat) return;
    await deleteCategory(deletingCat.id);
    setDeletingCat(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Categories & Taxonomy
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Organize dispensary catalog into ritual categories, botanical groupings, and storefront navigation.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddCategory}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#FAF9F6] border border-[#E8E1D5] hover:border-[#8B6D43]/60 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="h-40 rounded-xl overflow-hidden mb-4 relative bg-[#F4EFE6] border border-[#D2C2AD]/40">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/products/shampoo-bottle-3d.jpg";
                  }}
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs font-mono">
                  {cat.productCount} Items
                </span>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#2D2A26]">
                  {cat.name}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    cat.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {cat.status}
                </span>
              </div>

              <p className="text-xs text-[#2D2A26]/70 mt-2 line-clamp-2 leading-relaxed">
                {cat.description || "Holistic Ayurvedic botanical category."}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E8E1D5] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate(`#categories?category=${cat.name}`)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B6D43] hover:underline cursor-pointer"
              >
                <span>View in shop</span>
                <ExternalLink className="h-3 w-3" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditCategory(cat)}
                  className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCat(cat)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDeletingCat(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2D2A26]">
              Remove Category?
            </h3>
            <p className="text-xs text-[#2D2A26]/70 mt-2 leading-relaxed">
              Are you sure you want to remove <strong>{deletingCat.name}</strong>? Formulations assigned to this category will become uncategorized.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-5 py-2.5 bg-white border border-[#D2C2AD]/80 text-xs font-semibold rounded-xl hover:bg-[#F4EFE6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
