import React, { useState, useEffect, useMemo } from "react";
import { Users, Eye, Lock, Unlock, Mail, Phone, ShieldCheck } from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminCustomers,
  toggleCustomerBlock,
} from "../../../features/admin/store/admin-store.ts";
import type { CustomerRecord } from "../../../types/admin.ts";

interface CustomersViewProps {
  onSelectCustomer: (customer: CustomerRecord) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const loadData = () => {
    setCustomers(getStoredAdminCustomers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("customers_updated", loadData);
    return () => window.removeEventListener("customers_updated", loadData);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (tierFilter === "ALL") return customers;
    return customers.filter((c) => c.tier === tierFilter);
  }, [customers, tierFilter]);

  const handleToggleBlock = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleCustomerBlock(id);
    loadData();
  };

  const columns: ColumnDef<CustomerRecord>[] = [
    {
      id: "name",
      header: "Patron Name",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#8B6D43] text-white flex items-center justify-center font-serif text-xs font-bold shrink-0 shadow-2xs">
            {row.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-[#2D2A26] block">
              {row.name}
            </span>
            <span className="text-[11px] text-[#2D2A26]/60">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "tier",
      header: "VIP Tier",
      accessorKey: "tier",
      sortable: true,
      cell: (row) => (
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            row.tier === "APOTHECARY_VIP"
              ? "bg-[#8B6D43] text-white"
              : row.tier === "BOTANICAL_GOLD"
              ? "bg-[#F4EFE6] text-[#8B6D43] border border-[#D2C2AD]/60"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {row.tier.replace("_", " ")}
        </span>
      ),
    },
    {
      id: "ordersCount",
      header: "Orders",
      accessorKey: "ordersCount",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-[#2D2A26]">
          {row.ordersCount} orders
        </span>
      ),
    },
    {
      id: "totalSpent",
      header: "Lifetime Value (LTV)",
      accessorKey: "totalSpent",
      sortable: true,
      cell: (row) => (
        <span className="font-serif font-bold text-xs sm:text-sm text-[#8B6D43]">
          ₹{row.totalSpent}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: (row) => (
        <span className="text-xs text-[#2D2A26]/70">
          {row.city || "Bengaluru"}, {row.state || "India"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
            row.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
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
            onClick={() => onSelectCustomer(row)}
            className="p-1.5 rounded-lg text-[#2D2A26]/70 hover:text-[#8B6D43] hover:bg-[#F4EFE6] transition-colors"
            title="Inspect Patron Profile"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => handleToggleBlock(row.id, e)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === "ACTIVE"
                ? "text-[#2D2A26]/60 hover:text-rose-600 hover:bg-rose-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
            title={row.status === "ACTIVE" ? "Block Customer" : "Unblock Customer"}
          >
            {row.status === "ACTIVE" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Customer Database & CRM
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Registered patrons, VIP botanical members, lifetime purchase values, and notes.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#E8E1D5] pb-3 text-xs font-semibold uppercase tracking-wider">
        {[
          { id: "ALL", label: "All Patrons" },
          { id: "APOTHECARY_VIP", label: "Apothecary VIP" },
          { id: "BOTANICAL_GOLD", label: "Botanical Gold" },
          { id: "PATRON", label: "Patron" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTierFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              tierFilter === tab.id
                ? "bg-[#8B6D43] text-white font-bold"
                : "text-[#2D2A26]/70 hover:bg-[#F4EFE6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search patrons by name, email, phone, city..."
        searchField={(c) => `${c.name} ${c.email} ${c.phone} ${c.city}`}
        onRowClick={(c) => onSelectCustomer(c)}
        exportFileName="jass-customers-crm.csv"
      />
    </div>
  );
};
