import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Plus,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminProducts,
  getStoredInventoryLogs,
} from "../../../features/admin/store/admin-store.ts";
import type { ExtendedProduct } from "../../../types/admin.ts";

interface InventoryViewProps {
  onOpenAdjust: (product?: ExtendedProduct) => void;
  onOpenTimeline: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAdjust,
  onOpenTimeline,
}) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [logs, setLogs] = useState([]);
  const [healthFilter, setHealthFilter] = useState<string>("ALL");

  const loadData = () => {
    setProducts(getStoredAdminProducts());
    setLogs(getStoredInventoryLogs() as never);
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

  const totalUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const lowStockCount = products.filter(
    (p) => (p.stockQuantity || 0) <= (p.minStockThreshold || 15) && (p.stockQuantity || 0) > 0
  ).length;
  const outOfStockCount = products.filter((p) => (p.stockQuantity || 0) <= 0).length;
  const healthyCount = products.length - lowStockCount - outOfStockCount;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const qty = p.stockQuantity || 0;
      const threshold = p.minStockThreshold || 15;
      if (healthFilter === "HEALTHY") return qty > threshold;
      if (healthFilter === "LOW_STOCK") return qty <= threshold && qty > 0;
      if (healthFilter === "OUT_OF_STOCK") return qty <= 0;
      return true;
    });
  }, [products, healthFilter]);

  const columns: ColumnDef<ExtendedProduct>[] = [
    {
      id: "product",
      header: "Formulation Item",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.name}
            className="h-10 w-10 rounded-xl object-cover bg-[#F4EFE6] border border-[#D2C2AD]/50 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/products/herbal-shampoo/main.png";
            }}
          />
          <div>
            <span className="font-serif font-bold text-xs sm:text-sm text-[#2D2A26] block">
              {row.name}
            </span>
            <span className="text-[10px] text-[#8B6D43] font-mono">{row.sku}</span>
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
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#8B6D43]">
          {row.category}
        </span>
      ),
    },
    {
      id: "stockQuantity",
      header: "Current Stock",
      accessorKey: "stockQuantity",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-[#2D2A26]">
          {row.stockQuantity || 0} units
        </span>
      ),
    },
    {
      id: "threshold",
      header: "Reorder Alert",
      accessorKey: "minStockThreshold",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-[#2D2A26]/70">
          ≤ {row.minStockThreshold || 15} units
        </span>
      ),
    },
    {
      id: "health",
      header: "Stock Health",
      cell: (row) => {
        const qty = row.stockQuantity || 0;
        const threshold = row.minStockThreshold || 15;
        if (qty <= 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <XCircle className="h-3 w-3" />
              <span>Out of Stock</span>
            </span>
          );
        }
        if (qty <= threshold) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              <span>Low Stock</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            <span>Optimal</span>
          </span>
        );
      },
    },
    {
      id: "action",
      header: "Quick Action",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdjust(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D2C2AD]/80 hover:border-[#8B6D43] text-[11px] font-semibold text-[#8B6D43] rounded-xl hover:bg-[#F4EFE6] transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="h-3 w-3" />
          <span>Adjust Stock</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Stock & Inventory Control
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Real-time batch tracking, warehouse counts, low-stock warnings, and distillery restocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenTimeline}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D2C2AD]/80 hover:border-[#8B6D43] text-xs font-semibold text-[#2D2A26] rounded-xl hover:bg-[#F4EFE6]/50 transition-colors cursor-pointer shadow-2xs"
          >
            <History className="h-4 w-4 text-[#8B6D43]" />
            <span>Movement Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAdjust()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Boxes className="h-4 w-4" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E1D5] p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8B6D43] tracking-wider block mb-1">
            Total Inventory Units
          </span>
          <span className="font-serif text-2xl font-bold text-[#2D2A26]">{totalUnits}</span>
        </div>
        <div className="bg-white border border-[#E8E1D5] p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block mb-1">
            Healthy Formulations
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-700">{healthyCount}</span>
        </div>
        <div className="bg-white border border-[#E8E1D5] p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block mb-1">
            Low Stock Alerts
          </span>
          <span className="font-serif text-2xl font-bold text-amber-700">{lowStockCount}</span>
        </div>
        <div className="bg-white border border-[#E8E1D5] p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block mb-1">
            Out of Stock
          </span>
          <span className="font-serif text-2xl font-bold text-rose-700">{outOfStockCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#E8E1D5] pb-3 text-xs font-semibold uppercase tracking-wider">
        {[
          { id: "ALL", label: "All Items", count: products.length },
          { id: "HEALTHY", label: "Healthy", count: healthyCount },
          { id: "LOW_STOCK", label: "Low Stock Alert", count: lowStockCount },
          { id: "OUT_OF_STOCK", label: "Out of Stock", count: outOfStockCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setHealthFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              healthFilter === tab.id
                ? "bg-[#8B6D43] text-white font-bold"
                : "text-[#2D2A26]/70 hover:bg-[#F4EFE6]"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => String(p.id)}
        searchPlaceholder="Filter by SKU or item name..."
        searchField={(p) => `${p.name} ${p.sku} ${p.category}`}
        onRowClick={(p) => onOpenAdjust(p)}
        exportFileName="jass-inventory-report.csv"
      />
    </div>
  );
};
