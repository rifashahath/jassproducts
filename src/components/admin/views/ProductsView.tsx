import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  Eye,
  Filter,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminProducts,
  getStoredAdminCategories,
  deleteProduct,
} from "../../../features/admin/store/admin-store.ts";
import type { ExtendedProduct } from "../../../types/admin.ts";

interface ProductsViewProps {
  onOpenAddProduct: () => void;
  onEditProduct: (product: ExtendedProduct) => void;
  onAdjustStock: (product: ExtendedProduct) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenAddProduct,
  onEditProduct,
  onAdjustStock,
}) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [deletingProduct, setDeletingProduct] = useState<ExtendedProduct | null>(null);

  const loadData = () => {
    setProducts(getStoredAdminProducts());
    setCategories(getStoredAdminCategories() as never);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("products_updated", loadData);
    window.addEventListener("inventory_updated", loadData);
    return () => {
      window.removeEventListener("products_updated", loadData);
      window.removeEventListener("inventory_updated", loadData);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "ALL" ||
        p.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW_STOCK" && (p.stockQuantity || 0) <= (p.minStockThreshold || 15) && (p.stockQuantity || 0) > 0) ||
        (stockFilter === "OUT_OF_STOCK" && (p.stockQuantity || 0) <= 0) ||
        (stockFilter === "IN_STOCK" && (p.stockQuantity || 0) > (p.minStockThreshold || 15));
      return matchCat && matchStock;
    });
  }, [products, selectedCategory, stockFilter]);

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    await deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
    loadData();
  };

  const columns: ColumnDef<ExtendedProduct>[] = [
    {
      id: "product",
      header: "Botanical Formulation",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.name}
            className="h-10 w-10 rounded-xl object-cover bg-[#F4EFE6] border border-[#D2C2AD]/50 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/products/shampoo-bottle-3d.jpg";
            }}
          />
          <div className="min-w-0">
            <span className="font-serif font-bold text-xs sm:text-sm text-[#2D2A26] block truncate">
              {row.name}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-[#8B6D43] font-mono mt-0.5">
              <span>{row.sku}</span>
              <span>•</span>
              <span>{row.volume || "Standard Size"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (row) => (
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#8B6D43] border border-[#D2C2AD]/40">
          {row.category}
        </span>
      ),
    },
    {
      id: "price",
      header: "Price (₹)",
      accessorKey: "price",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-serif font-bold text-xs sm:text-sm text-[#2D2A26]">
            ₹{row.price}
          </span>
          {row.salePrice && row.salePrice < row.price && (
            <span className="block text-[10px] text-neutral-400 line-through">
              ₹{row.salePrice}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "stock",
      header: "Dispensary Stock",
      sortable: true,
      cell: (row) => {
        const qty = row.stockQuantity || 0;
        const threshold = row.minStockThreshold || 15;
        const isLow = qty <= threshold && qty > 0;
        const isOut = qty <= 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                isOut
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : isLow
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {qty} units
            </span>
            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
            row.status === "PUBLISHED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEditProduct(row)}
            className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
            title="Edit Formulation"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onAdjustStock(row)}
            className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
            title="Adjust Stock Count"
          >
            <Boxes className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingProduct(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Formulation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Botanical Catalog & Formulations
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Manage your master inventory of Ayurvedic haircare, skin serums, and vitality powders.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddProduct}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Formulation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#8B6D43] uppercase tracking-wider">
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-[#D2C2AD]/70 rounded-xl px-3 py-1.5 text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#8B6D43] uppercase tracking-wider">
            Stock Health:
          </span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-white border border-[#D2C2AD]/70 rounded-xl px-3 py-1.5 text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
          >
            <option value="ALL">All Levels</option>
            <option value="IN_STOCK">Healthy (In Stock)</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        <span className="text-xs text-[#2D2A26]/50 ml-auto">
          {filteredProducts.length} formulation(s) listed
        </span>
      </div>

      {/* Main Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => String(p.id)}
        searchPlaceholder="Search by name, SKU, or active herbs..."
        searchField={(p) => `${p.name} ${p.sku} ${p.category}`}
        onRowClick={(p) => onEditProduct(p)}
        exportFileName="jass-ayurveda-catalog.csv"
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDeletingProduct(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2D2A26]">
              Remove Formulation?
            </h3>
            <p className="text-xs text-[#2D2A26]/70 mt-2 leading-relaxed">
              Are you sure you want to delete <strong>{deletingProduct.name}</strong> ({deletingProduct.sku})? This formulation will no longer appear in the dispensary catalog.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
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
