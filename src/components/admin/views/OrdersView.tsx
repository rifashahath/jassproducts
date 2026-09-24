import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Eye,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminOrders,
  updateOrderStatus,
} from "../../../features/admin/store/admin-store.ts";
import type { AdminOrderRecord, AdminOrderStatus } from "../../../types/admin.ts";

interface OrdersViewProps {
  onSelectOrder: (order: AdminOrderRecord) => void;
  onOpenInvoice: (order: AdminOrderRecord) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onSelectOrder,
  onOpenInvoice,
}) => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = () => {
    setOrders(getStoredAdminOrders());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("orders_updated", loadData);
    return () => window.removeEventListener("orders_updated", loadData);
  }, []);

  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
      SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
      DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
      CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleQuickStatus = async (orderId: string, status: AdminOrderStatus) => {
    await updateOrderStatus(orderId, status);
    loadData();
  };

  const columns: ColumnDef<AdminOrderRecord>[] = [
    {
      id: "orderNumber",
      header: "Order Reference",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs sm:text-sm text-[#8B6D43] block">
            {row.orderNumber}
          </span>
          <span className="text-[10px] text-[#2D2A26]/50">
            {new Date(row.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Patron / Destination",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-[#2D2A26] block">
            {row.customerName}
          </span>
          <span className="text-[11px] text-[#2D2A26]/60 block">
            {row.shippingAddress.city}, {row.shippingAddress.state}
          </span>
          <span className="text-[10px] text-[#8B6D43] font-mono">{row.phone}</span>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-[#2D2A26] block">
            {row.items.length} formulation(s)
          </span>
          <span className="text-[11px] text-[#2D2A26]/60 line-clamp-1">
            {row.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
          </span>
        </div>
      ),
    },
    {
      id: "total",
      header: "Total Value",
      accessorKey: "total",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-serif font-bold text-sm text-[#2D2A26] block">
            ₹{row.total}
          </span>
          <span className="text-[10px] text-[#8B6D43] font-mono">
            {row.paymentMethod} • {row.paymentStatus}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Lifecycle Status",
      sortable: true,
      cell: (row) => (
        <select
          value={row.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            handleQuickStatus(row.id, e.target.value as AdminOrderStatus)
          }
          className="text-xs font-semibold bg-white border border-[#D2C2AD]/80 rounded-xl px-2.5 py-1 text-[#2D2A26] focus:outline-none focus:border-[#8B6D43] shadow-2xs"
        >
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectOrder(row)}
            className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
            title="Inspect Order"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenInvoice(row)}
            className="p-1.5 rounded-lg text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
            title="Print Invoice"
          >
            <Printer className="h-4 w-4" />
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
            Order Fulfillment & Dispatch
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Track customer orders, generate shipping manifests, update delivery statuses, and print invoices.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E1D5] pb-3 text-xs font-semibold uppercase tracking-wider">
        {(
          [
            { id: "ALL", label: "All Orders", count: counts.ALL },
            { id: "PENDING", label: "Pending", count: counts.PENDING },
            { id: "PROCESSING", label: "Processing", count: counts.PROCESSING },
            { id: "SHIPPED", label: "Shipped", count: counts.SHIPPED },
            { id: "DELIVERED", label: "Delivered", count: counts.DELIVERED },
            { id: "CANCELLED", label: "Cancelled", count: counts.CANCELLED },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? "bg-[#8B6D43] text-white font-bold shadow-2xs"
                : "text-[#2D2A26]/70 hover:bg-[#F4EFE6]"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Main Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search order number, customer name, phone, city..."
        searchField={(o) => `${o.orderNumber} ${o.customerName} ${o.email} ${o.phone} ${o.shippingAddress.city}`}
        onRowClick={(o) => onSelectOrder(o)}
        exportFileName="jass-orders-export.csv"
      />
    </div>
  );
};
