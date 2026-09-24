import React, { useState, useEffect } from "react";
import { CreditCard, IndianRupee, RotateCcw, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { DataTable, type ColumnDef } from "../common/DataTable.tsx";
import {
  getStoredAdminPayments,
  refundPayment,
} from "../../../features/admin/store/admin-store.ts";
import type { PaymentTransactionRecord } from "../../../types/admin.ts";

export const PaymentsView: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);

  const loadData = () => {
    setTransactions(getStoredAdminPayments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("payments_updated", loadData);
    return () => window.removeEventListener("payments_updated", loadData);
  }, []);

  const totalProcessed = transactions.reduce(
    (sum, t) => (t.status === "SUCCESS" ? sum + t.amount : sum),
    0
  );
  const totalNet = transactions.reduce(
    (sum, t) => (t.status === "SUCCESS" ? sum + t.netAmount : sum),
    0
  );
  const totalFees = totalProcessed - totalNet;

  const handleRefund = async (id: string) => {
    if (confirm("Are you sure you want to process a refund for this transaction?")) {
      await refundPayment(id);
      loadData();
    }
  };

  const columns: ColumnDef<PaymentTransactionRecord>[] = [
    {
      id: "gatewayTxnId",
      header: "Transaction Ref",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-[#8B6D43] block">
            {row.gatewayTxnId}
          </span>
          <span className="text-[10px] text-[#2D2A26]/50">Order: {row.orderId}</span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-[#2D2A26] block">
            {row.customerName}
          </span>
          <span className="text-[10px] text-[#2D2A26]/60">{row.customerEmail}</span>
        </div>
      ),
    },
    {
      id: "method",
      header: "Payment Mode",
      accessorKey: "method",
      sortable: true,
      cell: (row) => (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F4EFE6] text-[#8B6D43] border border-[#D2C2AD]/40">
          {row.method}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Gross Amount",
      accessorKey: "amount",
      sortable: true,
      cell: (row) => (
        <span className="font-serif font-bold text-sm text-[#2D2A26]">
          ₹{row.amount}
        </span>
      ),
    },
    {
      id: "netAmount",
      header: "Net Settlement",
      accessorKey: "netAmount",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-700">
          ₹{row.netAmount}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
            row.status === "SUCCESS"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "REFUNDED"
              ? "bg-purple-50 text-purple-700 border border-purple-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: (row) => (
        <div>
          {row.status === "SUCCESS" ? (
            <button
              type="button"
              onClick={() => handleRefund(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Refund</span>
            </button>
          ) : (
            <span className="text-[11px] text-[#2D2A26]/40 italic">Settled</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Payments & Financial Settlements
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Real-time Razorpay, UPI, NetBanking, and COD payment reconciliations with fee breakdowns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8B6D43] tracking-wider block mb-1">
            Gross Payments Captured
          </span>
          <span className="font-serif text-2xl font-bold text-[#2D2A26]">
            ₹{totalProcessed.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block mb-1">
            Net Bank Settlement
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-700">
            ₹{totalNet.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-white border border-[#E8E1D5] p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#2D2A26]/60 tracking-wider block mb-1">
            Gateway Fees & Tax
          </span>
          <span className="font-serif text-2xl font-bold text-[#2D2A26]/70">
            ₹{totalFees.toFixed(2)}
          </span>
        </div>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search gateway transaction ID, order ref, customer..."
        searchField={(t) => `${t.gatewayTxnId} ${t.orderId} ${t.customerName} ${t.customerEmail}`}
        exportFileName="jass-payments-report.csv"
      />
    </div>
  );
};
