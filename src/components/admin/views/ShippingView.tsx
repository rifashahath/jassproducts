import React, { useState, useEffect } from "react";
import { Truck, MapPin, Calendar, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import { getStoredAdminShipping } from "../../../features/admin/store/admin-store.ts";
import type { ShippingShipmentRecord } from "../../../types/admin.ts";

export const ShippingView: React.FC = () => {
  const [shipments, setShipments] = useState<ShippingShipmentRecord[]>([]);

  useEffect(() => {
    setShipments(getStoredAdminShipping());
  }, []);

  const columns: ColumnDef<ShippingShipmentRecord>[] = [
    {
      id: "orderId",
      header: "Order Reference",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-[#8B6D43] block">
          {row.orderId}
        </span>
      ),
    },
    {
      id: "courier",
      header: "Courier Partner",
      accessorKey: "courier",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#8B6D43]" />
          <span className="font-semibold text-xs text-[#2D2A26]">{row.courier}</span>
        </div>
      ),
    },
    {
      id: "awbNumber",
      header: "AWB Tracking Number",
      accessorKey: "awbNumber",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-[#2D2A26] bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#D2C2AD]/50">
          {row.awbNumber}
        </span>
      ),
    },
    {
      id: "destination",
      header: "Destination City",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-[#2D2A26]">
          <MapPin className="h-3.5 w-3.5 text-[#8B6D43]" />
          <span>{row.destinationCity}, {row.state}</span>
        </div>
      ),
    },
    {
      id: "estimatedDelivery",
      header: "Estimated Delivery",
      accessorKey: "estimatedDelivery",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-[#2D2A26]/80 font-medium">
          {row.estimatedDelivery}
        </span>
      ),
    },
    {
      id: "status",
      header: "Dispatch Status",
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
            row.status === "DELIVERED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "IN_TRANSIT"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {row.status.replace("_", " ")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Logistics & Shipping Operations
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Surface and express courier integrations across Delhivery, BlueDart, and DTDC.
          </p>
        </div>
      </div>

      <DataTable
        data={shipments}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search by AWB, order reference, city..."
        searchField={(s) => `${s.awbNumber} ${s.orderId} ${s.customerName} ${s.destinationCity}`}
        exportFileName="jass-shipping-manifest.csv"
      />
    </div>
  );
};
