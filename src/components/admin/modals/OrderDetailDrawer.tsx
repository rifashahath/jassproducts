import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Truck,
  Printer,
  FileText,
  User,
  MapPin,
  CreditCard,
  Send,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import type { AdminOrderRecord, AdminOrderStatus } from "../../../types/admin.ts";

interface OrderDetailDrawerProps {
  open: boolean;
  order: AdminOrderRecord | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: AdminOrderStatus, courier?: string, awb?: string) => void;
  onAddNote: (id: string, text: string) => void;
  onOpenInvoice: (order: AdminOrderRecord) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  open,
  order,
  onClose,
  onUpdateStatus,
  onAddNote,
  onOpenInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "fulfillment" | "notes">("overview");
  const [courierName, setCourierName] = useState(order?.courier || "Delhivery");
  const [awbNumber, setAwbNumber] = useState(order?.awbNumber || "");
  const [newStatus, setNewStatus] = useState<AdminOrderStatus>(order?.status || "PROCESSING");
  const [noteText, setNoteText] = useState("");

  if (!open || !order) return null;

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(order.id, newStatus, courierName, awbNumber);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(order.id, noteText.trim());
    setNoteText("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#FAF9F6] border-l border-[#E8E1D5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Top Header */}
          <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/60 flex items-center justify-center text-[#8B6D43]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                  Order {order.orderNumber}
                </h3>
                <p className="text-[11px] font-mono text-[#8B6D43]">
                  Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInvoice(order)}
                className="p-2 rounded-lg text-[#8B6D43] hover:bg-[#F4EFE6] border border-[#D2C2AD]/60 transition-colors"
                title="Print Tax Invoice"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-[#2D2A26]/50 hover:text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-[#E8E1D5] bg-[#FAF8F5] px-6 text-xs font-semibold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "border-[#8B6D43] text-[#8B6D43] font-bold bg-[#FAF9F6]"
                  : "border-transparent text-[#2D2A26]/60 hover:text-[#2D2A26]"
              }`}
            >
              Overview & Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fulfillment")}
              className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "fulfillment"
                  ? "border-[#8B6D43] text-[#8B6D43] font-bold bg-[#FAF9F6]"
                  : "border-transparent text-[#2D2A26]/60 hover:text-[#2D2A26]"
              }`}
            >
              Fulfillment Status
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === "notes"
                  ? "border-[#8B6D43] text-[#8B6D43] font-bold bg-[#FAF9F6]"
                  : "border-transparent text-[#2D2A26]/60 hover:text-[#2D2A26]"
              }`}
            >
              Staff Notes ({order.notes?.length || 0})
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Customer Card */}
                <div className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#8B6D43] uppercase tracking-wider">
                      <User className="h-4 w-4" />
                      <span>Customer & Delivery</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4EFE6] text-[#8B6D43] font-semibold">
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#2D2A26]">{order.customerName}</p>
                    <p className="text-xs text-[#2D2A26]/70 mt-0.5">
                      {order.email} • {order.phone}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#E8E1D5] flex items-start gap-2 text-xs text-[#2D2A26]/80">
                    <MapPin className="h-4 w-4 text-[#8B6D43] shrink-0 mt-0.5" />
                    <span>
                      {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8B6D43] mb-3">
                    Dispensary Items ({order.items.length})
                  </h4>
                  <div className="border border-[#E8E1D5] rounded-2xl divide-y divide-[#E8E1D5]/70 overflow-hidden bg-white">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover bg-[#F4EFE6] border border-[#D2C2AD]/40"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/products/shampoo-bottle-3d.jpg";
                              }}
                            />
                          )}
                          <div>
                            <p className="font-semibold text-xs text-[#2D2A26]">{item.name}</p>
                            <p className="text-[10px] text-[#8B6D43] font-mono">
                              {item.category || "BOTANICAL"} • {item.volume || "Standard Size"}
                            </p>
                            <span className="text-[11px] text-[#2D2A26]/60">
                              Qty: <strong>{item.quantity}</strong> × ₹{item.price}
                            </span>
                          </div>
                        </div>
                        <span className="font-serif font-bold text-sm text-[#2D2A26]">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
                  <div className="flex justify-between text-[#2D2A26]/70">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#2D2A26]/70">
                    <span>Applicable GST (18%)</span>
                    <span>₹{order.tax || 0}</span>
                  </div>
                  <div className="flex justify-between text-[#2D2A26]/70">
                    <span>Pan-India Courier Logistics</span>
                    <span className="text-emerald-700 font-semibold">
                      {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E8E1D5] flex justify-between font-bold text-sm text-[#2D2A26]">
                    <span>Total Amount</span>
                    <span className="font-serif text-base text-[#8B6D43]">₹{order.total}</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "fulfillment" && (
              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8B6D43]">
                    Update Order Lifecycle Status
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                      Current Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as AdminOrderStatus)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-semibold text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                    >
                      <option value="PENDING">PENDING (Awaiting Review)</option>
                      <option value="PROCESSING">PROCESSING (Lab Batch Packed)</option>
                      <option value="SHIPPED">SHIPPED (In Transit with Courier)</option>
                      <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                      <option value="CANCELLED">CANCELLED (Void / Refunded)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                        Logistics Courier
                      </label>
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Delhivery, BlueDart, DTDC"
                        className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                        Tracking AWB Number
                      </label>
                      <input
                        type="text"
                        value={awbNumber}
                        onChange={(e) => setAwbNumber(e.target.value)}
                        placeholder="e.g. DEL-90823411"
                        className="w-full px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Fulfillment Update
                  </button>
                </div>
              </form>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <form onSubmit={handleAddNoteSubmit} className="space-y-2">
                  <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider">
                    Add Internal Note
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="e.g. Customer requested extra safe bubble wrap..."
                      className="flex-1 px-3.5 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {(!order.notes || order.notes.length === 0) ? (
                    <p className="text-xs text-[#2D2A26]/40 py-6 text-center">
                      No internal notes recorded on this order yet.
                    </p>
                  ) : (
                    order.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs text-[#2D2A26]"
                      >
                        {note}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
