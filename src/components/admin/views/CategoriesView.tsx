import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Package,
  Search,
  LayoutGrid,
  Tag,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  List,
  Download,
  Star,
  Check,
  Eye,
  Sparkles,
} from "lucide-react";
import {
  getStoredAdminCategories,
  fetchAdminCategories,
  getStoredAdminProducts,
  fetchAdminProducts,
  deleteCategory,
  deleteProduct,
} from "../../../features/admin/store/admin-store.ts";
import type { CategoryItem, ExtendedProduct } from "../../../types/admin.ts";

interface CategoriesViewProps {
  onOpenAddCategory: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onOpenAddProduct?: (categoryName?: string) => void;
  onEditProduct?: (product: ExtendedProduct) => void;
  onNavigate: (path: string) => void;
}

function isCategoryProductMatch(catName: string, prodCat: string): boolean {
  if (!catName || !prodCat) return false;
  const normCat = catName.toLowerCase().trim();
  const normProd = prodCat.toLowerCase().trim();
  return normProd === normCat || normProd.includes(normCat) || normCat.includes(normProd);
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onOpenAddCategory,
  onEditCategory,
  onOpenAddProduct,
  onEditProduct,
  onNavigate,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<ExtendedProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Main Dashboard Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Category Detail Drilldown Filters
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [productStockFilter, setProductStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [productSort, setProductSort] = useState<"NEWEST" | "PRICE_LOW" | "PRICE_HIGH" | "NAME">("NEWEST");
  const [detailViewMode, setDetailViewMode] = useState<"grid" | "list">("grid");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const detailItemsPerPage = 8;

  // Deletion Modal States
  const [deletingCat, setDeletingCat] = useState<CategoryItem | null>(null);
  const [deletingProd, setDeletingProd] = useState<ExtendedProduct | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = () => {
    const cats = getStoredAdminCategories();
    const prods = getStoredAdminProducts();
    setAllProducts(prods);
    setCategories(
      cats.map((c) => ({
        ...c,
        productCount: prods.filter((p) => isCategoryProductMatch(c.name, p.category)).length,
      }))
    );
  };

  useEffect(() => {
    loadData();
    fetchAdminCategories().then(() => loadData()).catch(() => {});
    fetchAdminProducts().then(() => loadData()).catch(() => {});

    window.addEventListener("categories_updated", loadData);
    window.addEventListener("products_updated", loadData);
    return () => {
      window.removeEventListener("categories_updated", loadData);
      window.removeEventListener("products_updated", loadData);
    };
  }, []);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === "ACTIVE").length;
    const totalProducts = allProducts.length;
    return { total, active, totalProducts };
  }, [categories, allProducts]);

  // Main Categories Filtered List
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;

  // Products filtered within the Selected Category Drilldown
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter((p) => isCategoryProductMatch(selectedCategory.name, p.category));
  }, [selectedCategory, allProducts]);

  const filteredCategoryProducts = useMemo(() => {
    let result = categoryProducts;

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (productStatusFilter !== "ALL") {
      result = result.filter((p) =>
        productStatusFilter === "ACTIVE" ? p.status === "PUBLISHED" : p.status !== "PUBLISHED"
      );
    }

    if (productStockFilter !== "ALL") {
      result = result.filter((p) => {
        const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
        return productStockFilter === "IN_STOCK" ? qty > 0 : qty === 0;
      });
    }

    if (productSort === "PRICE_LOW") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (productSort === "PRICE_HIGH") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (productSort === "NAME") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [categoryProducts, productSearch, productStatusFilter, productStockFilter, productSort]);

  const paginatedCategoryProducts = useMemo(() => {
    const start = (detailCurrentPage - 1) * detailItemsPerPage;
    return filteredCategoryProducts.slice(start, start + detailItemsPerPage);
  }, [filteredCategoryProducts, detailCurrentPage, detailItemsPerPage]);

  const detailTotalPages = Math.ceil(filteredCategoryProducts.length / detailItemsPerPage) || 1;

  const handleDeleteCategoryConfirm = async () => {
    if (!deletingCat) return;
    await deleteCategory(deletingCat.id);
    setDeletingCat(null);
    if (selectedCategory?.id === deletingCat.id) {
      setSelectedCategory(null);
    }
    loadData();
    showToast(`Category "${deletingCat.name}" removed.`);
  };

  const handleDeleteProductConfirm = async () => {
    if (!deletingProd) return;
    await deleteProduct(deletingProd.id);
    setDeletingProd(null);
    loadData();
    showToast(`Formulation "${deletingProd.name}" removed.`);
  };

  const handleExportCSV = () => {
    if (!selectedCategory || categoryProducts.length === 0) {
      showToast("No formulations to export.");
      return;
    }
    const headers = ["ID", "Name", "SKU", "Category", "Price", "Stock", "Status"];
    const rows = categoryProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.price,
      p.stockQuantity ?? (p.inStock ? 50 : 0),
      p.status || "PUBLISHED",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedCategory.slug || "category"}-formulations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported category CSV catalog.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2D2A26] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO A: CATEGORY DETAIL VIEW (DRILLDOWN)              */}
      {/* ======================================================== */}
      {selectedCategory ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Back Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 -ml-2 rounded-xl text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
                  title="Back to All Categories"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
                  {selectedCategory.name}
                </h1>
                <span className="bg-[#8B6D43]/10 text-[#8B6D43] border border-[#8B6D43]/20 text-xs font-bold px-3 py-1 rounded-full">
                  {categoryProducts.length} Formulations
                </span>
              </div>
              {selectedCategory.description && (
                <p className="mt-1 text-xs text-[#2D2A26]/70 ml-9 max-w-xl">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 border border-[#D2C2AD] bg-white hover:bg-[#FAF9F6] text-[#2D2A26] text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#8B6D43]" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddProduct?.(selectedCategory.name)}
                className="inline-flex items-center gap-1.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Add Formulation</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCategory(selectedCategory)}
                className="inline-flex items-center gap-1.5 border border-[#D2C2AD] bg-white hover:bg-[#FAF9F6] text-[#2D2A26] text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#8B6D43]" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setDeletingCat(selectedCategory)}
                className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Filter, Search & Layout Control Bar */}
          <div className="bg-white border border-[#E8E1D5] p-3.5 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 w-full sm:w-auto flex-wrap">
              {/* Product Search */}
              <div className="relative flex-1 sm:w-60 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setDetailCurrentPage(1);
                  }}
                  placeholder="Search formulations in category..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] placeholder:text-neutral-400 focus:outline-none focus:border-[#8B6D43]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={productStatusFilter}
                onChange={(e) => {
                  setProductStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE");
                  setDetailCurrentPage(1);
                }}
                className="bg-[#FAF9F6] border border-[#D2C2AD]/80 text-xs font-semibold px-3 py-2 rounded-xl text-[#2D2A26] focus:outline-none focus:border-[#8B6D43] cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Published Only</option>
                <option value="INACTIVE">Draft / Hidden</option>
              </select>

              {/* Stock Filter */}
              <select
                value={productStockFilter}
                onChange={(e) => {
                  setProductStockFilter(e.target.value as "ALL" | "IN_STOCK" | "OUT_OF_STOCK");
                  setDetailCurrentPage(1);
                }}
                className="bg-[#FAF9F6] border border-[#D2C2AD]/80 text-xs font-semibold px-3 py-2 rounded-xl text-[#2D2A26] focus:outline-none focus:border-[#8B6D43] cursor-pointer"
              >
                <option value="ALL">Stock: All</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value as any)}
                className="bg-[#FAF9F6] border border-[#D2C2AD]/80 text-xs font-semibold px-3 py-2 rounded-xl text-[#2D2A26] focus:outline-none focus:border-[#8B6D43] cursor-pointer hidden md:block"
              >
                <option value="NEWEST">Sort: Default</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
                <option value="NAME">Name: A to Z</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 rounded-xl border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setDetailViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  detailViewMode === "grid"
                    ? "bg-white text-[#8B6D43] shadow-2xs font-bold"
                    : "text-[#2D2A26]/50 hover:text-[#2D2A26]"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDetailViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  detailViewMode === "list"
                    ? "bg-white text-[#8B6D43] shadow-2xs font-bold"
                    : "text-[#2D2A26]/50 hover:text-[#2D2A26]"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Formulations Grid / List Display */}
          {filteredCategoryProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#D2C2AD] rounded-3xl p-8 space-y-3">
              <Package className="h-10 w-10 text-[#8B6D43]/50 mx-auto" />
              <h3 className="font-serif text-base font-bold text-[#2D2A26]">No Formulations Found</h3>
              <p className="text-xs text-[#2D2A26]/70 max-w-sm mx-auto">
                No formulations currently match your filter criteria in &ldquo;{selectedCategory.name}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => onOpenAddProduct?.(selectedCategory.name)}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#8B6D43] hover:bg-[#735732] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-xs"
              >
                <Plus className="h-4 w-4" /> Add Formulation to {selectedCategory.name}
              </button>
            </div>
          ) : detailViewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginatedCategoryProducts.map((p) => {
                const stockQty = p.stockQuantity ?? (p.inStock ? 50 : 0);

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E8E1D5] hover:border-[#8B6D43]/60 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Thumbnail Area */}
                      <div className="relative h-44 w-full bg-[#FAF9F6] border border-[#E8E1D5]/60 rounded-xl overflow-hidden flex items-center justify-center p-3 mb-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/products/herbal-shampoo/main.webp";
                          }}
                        />
                        {p.badge && (
                          <span className="absolute top-2.5 right-2.5 bg-[#8B6D43]/10 text-[#8B6D43] border border-[#8B6D43]/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                            {p.badge}
                          </span>
                        )}
                        {p.volume && (
                          <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-[#2D2A26] border border-[#E8E1D5] text-[9px] font-mono px-1.5 py-0.5 rounded">
                            {p.volume}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#8B6D43] mb-1">
                        <span>{p.sku}</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            stockQty > 15
                              ? "bg-emerald-50 text-emerald-700"
                              : stockQty > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {stockQty > 0 ? `${stockQty} units` : "Out of stock"}
                        </span>
                      </div>

                      <h4 className="font-serif text-sm font-bold text-[#2D2A26] line-clamp-2 leading-snug mb-2 group-hover:text-[#8B6D43] transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between">
                      <span className="font-serif text-base font-bold text-[#2D2A26]">
                        ₹{p.price}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onNavigate(`#product/${p.id}`)}
                          className="p-1.5 rounded-lg text-[#2D2A26]/60 hover:text-[#8B6D43] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                          title="View on Storefront"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct?.(p)}
                          className="p-1.5 rounded-lg text-[#2D2A26]/60 hover:text-[#8B6D43] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                          title="Edit Formulation"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProd(p)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Formulation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Mode Table */
            <div className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-[#2D2A26]">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E1D5] text-[10px] font-mono uppercase tracking-wider text-[#8B6D43]">
                  <tr>
                    <th className="py-3 px-4">Formulation</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">MRP (₹)</th>
                    <th className="py-3 px-4">Dispensary Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D5]">
                  {paginatedCategoryProducts.map((p) => {
                    const stockQty = p.stockQuantity ?? (p.inStock ? 50 : 0);
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 object-contain rounded-lg bg-[#FAF8F5] border border-[#E8E1D5] p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/products/herbal-shampoo/main.webp";
                              }}
                            />
                            <div>
                              <span className="font-semibold block">{p.name}</span>
                              <span className="text-[10px] text-[#2D2A26]/50">{p.volume || "Standard Unit"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#8B6D43]">{p.sku}</td>
                        <td className="py-3 px-4 font-serif font-bold text-sm">₹{p.price}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                              stockQty > 15
                                ? "bg-emerald-50 text-emerald-700"
                                : stockQty > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {stockQty} units
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.status || "PUBLISHED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onNavigate(`#product/${p.id}`)}
                              className="p-1 rounded text-[#2D2A26]/60 hover:text-[#8B6D43]"
                              title="View in Storefront"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditProduct?.(p)}
                              className="p-1 rounded text-[#2D2A26]/60 hover:text-[#8B6D43]"
                              title="Edit Formulation"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProd(p)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              title="Delete Formulation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {detailTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E8E1D5] pt-4 text-xs text-[#2D2A26]/70">
              <span>
                Showing {(detailCurrentPage - 1) * detailItemsPerPage + 1} to{" "}
                {Math.min(detailCurrentPage * detailItemsPerPage, filteredCategoryProducts.length)} of{" "}
                {filteredCategoryProducts.length} formulations
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={detailCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-[#D2C2AD] bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs font-bold text-[#8B6D43]">
                  {detailCurrentPage} / {detailTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailCurrentPage((p) => Math.min(detailTotalPages, p + 1))}
                  disabled={detailCurrentPage === detailTotalPages}
                  className="p-1.5 rounded-lg border border-[#D2C2AD] bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* SCENARIO B: MAIN CATEGORIES DASHBOARD (OVERVIEW)         */
        /* ======================================================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
                Categories & Taxonomy
              </h1>
              <p className="text-xs text-[#2D2A26]/70 mt-1">
                Organize dispensary catalog into ritual categories, botanical groupings, and storefront navigation.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Search Input */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] placeholder:text-neutral-400 focus:outline-none focus:border-[#8B6D43] shadow-2xs"
                />
              </div>

              {/* Status Filter Toggle */}
              <button
                type="button"
                onClick={() =>
                  setStatusFilter((prev) => (prev === "ALL" ? "ACTIVE" : prev === "ACTIVE" ? "INACTIVE" : "ALL"))
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer ${
                  statusFilter !== "ALL"
                    ? "bg-[#8B6D43]/10 text-[#8B6D43] border-[#8B6D43]"
                    : "bg-white text-[#2D2A26] border-[#D2C2AD]/80 hover:bg-[#FAF9F6]"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{statusFilter === "ALL" ? "Filter: All" : statusFilter}</span>
              </button>

              {/* Add Category Primary CTA */}
              <button
                type="button"
                onClick={onOpenAddCategory}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards (Matching Reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="h-12 w-12 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-center text-[#8B6D43] shrink-0">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8B6D43] uppercase tracking-wider">
                  Total Categories
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#2D2A26]">{metrics.total}</h3>
                <p className="text-[11px] text-[#2D2A26]/50">Master catalog groups</p>
              </div>
            </div>

            <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Active Categories
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#2D2A26]">{metrics.active}</h3>
                <p className="text-[11px] text-[#2D2A26]/50">Visible on live store</p>
              </div>
            </div>

            <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Total Formulations
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#2D2A26]">{metrics.totalProducts}</h3>
                <p className="text-[11px] text-[#2D2A26]/50">Across all categories</p>
              </div>
            </div>
          </div>

          {/* Grid of Category Cards with Drilldown Clickability */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#D2C2AD] rounded-3xl p-8 space-y-3">
              <Layers className="h-10 w-10 text-[#8B6D43]/50 mx-auto" />
              <h3 className="font-serif text-base font-bold text-[#2D2A26]">No Categories Found</h3>
              <p className="text-xs text-[#2D2A26]/70 max-w-sm mx-auto">
                No categories matched your search query &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={onOpenAddCategory}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#8B6D43] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-xs"
              >
                <Plus className="h-4 w-4" /> Create Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-[#E8E1D5] hover:border-[#8B6D43]/60 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Category Cover Image with Drilldown Overlay */}
                    <div
                      onClick={() => setSelectedCategory(cat)}
                      className="h-44 rounded-xl overflow-hidden mb-4 relative bg-[#F4EFE6] border border-[#D2C2AD]/40 cursor-pointer group-hover:shadow-xs transition-all"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/products/herbal-shampoo/main.webp";
                        }}
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs font-mono shadow-xs">
                        {cat.productCount ?? 0} Formulations
                      </span>

                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-xl bg-white text-[#2D2A26] font-semibold text-xs shadow-md">
                          Explore Category Formulations &rarr;
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3
                        onClick={() => setSelectedCategory(cat)}
                        className="font-serif text-lg font-bold text-[#2D2A26] group-hover:text-[#8B6D43] transition-colors cursor-pointer"
                      >
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

                    <p className="text-xs text-[#2D2A26]/70 line-clamp-2 leading-relaxed">
                      {cat.description || "Holistic Ayurvedic botanical category."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E8E1D5] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigate(`#categories?category=${encodeURIComponent(cat.name)}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B6D43] hover:underline cursor-pointer"
                    >
                      <span>View in shop</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        title="View Category Products"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditCategory(cat)}
                        className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCat(cat)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E8E1D5] pt-4 text-xs text-[#2D2A26]/70">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of{" "}
                {filteredCategories.length} categories
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#D2C2AD] bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs font-bold text-[#8B6D43]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-[#D2C2AD] bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
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
              Are you sure you want to remove <strong>{deletingCat.name}</strong>? {deletingCat.productCount ? `${deletingCat.productCount} formulations in this category will become unassigned.` : "No formulations will be affected."}
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
                onClick={handleDeleteCategoryConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Dialog */}
      {deletingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDeletingProd(null)}
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
              Are you sure you want to remove <strong>{deletingProd.name}</strong>? This will permanently delete it from the cloud database catalog.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProd(null)}
                className="px-5 py-2.5 bg-white border border-[#D2C2AD]/80 text-xs font-semibold rounded-xl hover:bg-[#F4EFE6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProductConfirm}
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
