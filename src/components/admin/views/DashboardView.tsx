import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  IndianRupee,
  Package,
  Plus,
  Boxes,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { StatCard } from "../common/StatCard.tsx";
import {
  getStoredAdminProducts,
  getStoredAdminOrders,
  getStoredAdminCustomers,
  updateOrderStatus,
} from "../../../features/admin/store/admin-store.ts";
import type { AdminOrderRecord, ExtendedProduct } from "../../../types/admin.ts";

interface DashboardViewProps {
  onNavigate: (path: string) => void;
  onOpenAddProduct: () => void;
  onOpenStockAdjust: () => void;
  onSelectOrder: (order: AdminOrderRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddProduct,
  onOpenStockAdjust,
  onSelectOrder,
}) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [customers, setCustomers] = useState([]);

  const loadData = () => {
    setProducts(getStoredAdminProducts());
    setOrders(getStoredAdminOrders());
    setCustomers(getStoredAdminCustomers() as never);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("orders_updated", loadData);
    window.addEventListener("products_updated", loadData);
    window.addEventListener("inventory_updated", loadData);
    return () => {
      window.removeEventListener("orders_updated", loadData);
      window.removeEventListener("products_updated", loadData);
      window.removeEventListener("inventory_updated", loadData);
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const activeCustomers = customers.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const lowStockProducts = products.filter(
    (p) => (p.stockQuantity || 0) <= (p.minStockThreshold || 15)
  );

  const handleQuickStatusChange = async (orderId: string, status: AdminOrderRecord["status"]) => {
    await updateOrderStatus(orderId, status);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#8B6D43] bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#D2C2AD]/50 font-bold">
              Dispensary Control Center
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2A26] font-bold">
            Dispensary Overview
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Real-time analytics for pure Ayurvedic formulations, orders, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Formulation</span>
          </button>
          <button
            type="button"
            onClick={onOpenStockAdjust}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D2C2AD]/80 hover:border-[#8B6D43] text-xs font-semibold text-[#2D2A26] rounded-xl hover:bg-[#F4EFE6]/50 transition-colors cursor-pointer shadow-2xs"
          >
            <Boxes className="h-4 w-4 text-[#8B6D43]" />
            <span>Reconcile Stock</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Dispensary Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          change="+18.4% this month"
          changeType="positive"
          icon={IndianRupee}
          onClick={() => onNavigate("#admin/orders")}
        />
        <StatCard
          title="Total Orders Fulfilled"
          value={totalOrders.toString()}
          change="Real-time sync"
          changeType="positive"
          icon={ShoppingBag}
          onClick={() => onNavigate("#admin/orders")}
        />
        <StatCard
          title="Active Apothecary Patrons"
          value={activeCustomers.toString()}
          change="+4 joined this week"
          changeType="positive"
          icon={Users}
          onClick={() => onNavigate("#admin/customers")}
        />
        <StatCard
          title="Average Order Value (AOV)"
          value={`₹${avgOrderValue.toLocaleString("en-IN")}`}
          change="Calculated"
          changeType="neutral"
          icon={TrendingUp}
          onClick={() => onNavigate("#admin/reports")}
        />
      </div>

      {/* Main Split: Recent Orders & Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (8 cols): Recent Orders Table */}
        <div className="lg:col-span-8 bg-[#FAF9F6] border border-[#E8E1D5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-4">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-[#8B6D43]" />
              <h2 className="font-serif text-lg font-bold text-[#2D2A26]">
                Recent Botanical Orders
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("#admin/orders")}
              className="text-xs font-semibold text-[#8B6D43] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#E8E1D5]/70 overflow-x-auto">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F4EFE6]/30 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => onSelectOrder(order)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#8B6D43]">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.status === "SHIPPED"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : order.status === "PROCESSING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#2D2A26] mt-0.5">
                    {order.customerName} • {order.items.length} item(s)
                  </p>
                  <p className="text-[11px] text-[#2D2A26]/50">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-serif font-bold text-sm text-[#2D2A26]">
                    ₹{order.total}
                  </span>
                  <select
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleQuickStatusChange(
                        order.id,
                        e.target.value as AdminOrderRecord["status"]
                      )
                    }
                    className="text-[11px] font-semibold bg-white border border-[#D2C2AD]/70 rounded-lg px-2 py-1 text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (4 cols): Low Stock Warnings & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Card */}
          <div className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
                  Low Stock Formulations ({lowStockProducts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("#admin/inventory")}
                className="text-[11px] font-semibold text-[#8B6D43] hover:underline"
              >
                Stock control →
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-[#2D2A26]/50 py-4 text-center">
                All botanical inventories are healthy and above threshold.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white border border-[#E8E1D5] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-9 w-9 rounded-lg object-cover bg-[#F4EFE6] border border-[#D2C2AD]/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#2D2A26] truncate">{p.name}</p>
                        <span className="text-[10px] text-[#8B6D43] font-mono">{p.sku}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {p.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Dispensary Shortcuts */}
          <div className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#2D2A26] border-b border-[#E8E1D5] pb-3">
              Direct Dispensary Portals
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate("#admin/products")}
                className="p-3 bg-white border border-[#D2C2AD]/60 hover:border-[#8B6D43] rounded-xl text-left hover:bg-[#F4EFE6]/40 transition-colors cursor-pointer"
              >
                <Package className="h-4 w-4 text-[#8B6D43] mb-1.5" />
                <span className="font-semibold block text-[#2D2A26]">Products</span>
                <span className="text-[10px] text-[#2D2A26]/50">Edit catalog</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("#admin/categories")}
                className="p-3 bg-white border border-[#D2C2AD]/60 hover:border-[#8B6D43] rounded-xl text-left hover:bg-[#F4EFE6]/40 transition-colors cursor-pointer"
              >
                <Layers className="h-4 w-4 text-[#8B6D43] mb-1.5" />
                <span className="font-semibold block text-[#2D2A26]">Categories</span>
                <span className="text-[10px] text-[#2D2A26]/50">Taxonomy</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("#admin/payments")}
                className="p-3 bg-white border border-[#D2C2AD]/60 hover:border-[#8B6D43] rounded-xl text-left hover:bg-[#F4EFE6]/40 transition-colors cursor-pointer"
              >
                <IndianRupee className="h-4 w-4 text-[#8B6D43] mb-1.5" />
                <span className="font-semibold block text-[#2D2A26]">Payments</span>
                <span className="text-[10px] text-[#2D2A26]/50">Settlements</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("#admin/reports")}
                className="p-3 bg-white border border-[#D2C2AD]/60 hover:border-[#8B6D43] rounded-xl text-left hover:bg-[#F4EFE6]/40 transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 text-[#8B6D43] mb-1.5" />
                <span className="font-semibold block text-[#2D2A26]">Reports</span>
                <span className="text-[10px] text-[#2D2A26]/50">Analytics & GST</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
