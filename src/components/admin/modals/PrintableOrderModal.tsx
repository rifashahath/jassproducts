import React from "react";
import { X, Printer, CheckCircle2 } from "lucide-react";
import type { AdminOrderRecord } from "../../../types/admin.ts";

interface PrintableOrderModalProps {
  open: boolean;
  order: AdminOrderRecord | null;
  onClose: () => void;
}

export const PrintableOrderModal: React.FC<PrintableOrderModalProps> = ({
  open,
  order,
  onClose,
}) => {
  if (!open || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-10 my-8 print:p-0 print:shadow-none print:w-full">
        {/* Print Bar (Hidden during actual paper print) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#8B6D43] uppercase tracking-wider">
              Dispensary Tax Invoice
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div className="space-y-6">
          {/* Header Masthead */}
          <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                JASS AYURVEDA
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Authentic Botanical Formulations & Dispensary
              </p>
              <p className="text-xs text-neutral-600 mt-2">
                Nilgiris Distillery & Extraction Lab<br />
                Karnataka & Tamil Nadu, India<br />
                GSTIN: 29AABCJ1984K1Z4
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-[#F4EFE6] text-[#8B6D43] font-mono text-xs font-bold px-3 py-1 rounded-md mb-2">
                ORIGINAL TAX INVOICE
              </span>
              <p className="font-mono text-xs font-bold text-neutral-800">
                Invoice No: {order.orderNumber}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>
              <p className="text-xs text-neutral-500">
                Payment: {order.paymentMethod} ({order.paymentStatus})
              </p>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-6 text-xs pb-4 border-b border-neutral-200">
            <div>
              <p className="font-mono text-[10px] uppercase font-bold text-[#8B6D43] mb-1">
                Billed / Shipped To:
              </p>
              <p className="font-bold text-sm text-neutral-900">{order.customerName}</p>
              <p className="text-neutral-600 mt-0.5">{order.shippingAddress.street}</p>
              <p className="text-neutral-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
              <p className="text-neutral-600 mt-1">Phone: {order.phone}</p>
              <p className="text-neutral-600">Email: {order.email}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase font-bold text-[#8B6D43] mb-1">
                Logistics & Dispatch:
              </p>
              <p className="font-semibold text-neutral-800">Courier: {order.courier || "Delhivery Surface"}</p>
              <p className="font-mono text-xs text-neutral-600 mt-0.5">AWB: {order.awbNumber || "PENDING"}</p>
              <p className="text-neutral-600 mt-1">Status: {order.status}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-[#8B6D43] font-mono uppercase text-[10px]">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-center">HSN Code</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-semibold text-neutral-900">
                    {item.name}
                    <span className="block text-[10px] font-normal text-neutral-500">
                      {item.category} • {item.volume || "Standard Unit"}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono text-neutral-500">3305.90</td>
                  <td className="py-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 text-right">₹{item.price}</td>
                  <td className="py-3 text-right font-semibold">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Breakdown */}
          <div className="border-t border-neutral-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>CGST (9%) + SGST (9%)</span>
                <span>₹{order.tax || 0}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Pan-India Delivery</span>
                <span>{order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}</span>
              </div>
              <div className="pt-2 border-t-2 border-neutral-900 flex justify-between font-bold text-sm text-neutral-900">
                <span>Invoice Total</span>
                <span className="font-serif text-base text-[#8B6D43]">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Legal / Apothecary Stamp */}
          <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
            <p>100% Pure Organic Ayurvedic Formulations • Handcrafted in Nilgiris</p>
            <p className="font-mono text-[10px] text-[#8B6D43]">Authorized Signatory: Jass Dispensary</p>
          </div>
        </div>
      </div>
    </div>
  );
};
