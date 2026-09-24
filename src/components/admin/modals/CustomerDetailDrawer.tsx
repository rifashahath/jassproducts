import React, { useState } from "react";
import {
  X,
  User,
  ShoppingBag,
  IndianRupee,
  Lock,
  Unlock,
  Send,
  Calendar,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import type { CustomerRecord } from "../../../types/admin.ts";

interface CustomerDetailDrawerProps {
  open: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  onToggleBlock: (id: string) => void;
  onAddNote: (id: string, note: string) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  open,
  customer,
  onClose,
  onToggleBlock,
  onAddNote,
}) => {
  const [noteText, setNoteText] = useState("");

  if (!open || !customer) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(customer.id, noteText.trim());
    setNoteText("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] border-l border-[#E8E1D5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#8B6D43] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#2D2A26]">
                  {customer.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F4EFE6] text-[#8B6D43] border border-[#D2C2AD]/50 uppercase tracking-wider">
                  {customer.tier.replace("_", " ")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#2D2A26]/50 hover:text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E8E1D5] rounded-xl p-3">
                <span className="text-[10px] uppercase font-semibold text-[#8B6D43] tracking-wider block mb-1">
                  Lifetime Value
                </span>
                <span className="font-serif text-lg font-bold text-[#2D2A26]">
                  ₹{customer.totalSpent}
                </span>
              </div>
              <div className="bg-white border border-[#E8E1D5] rounded-xl p-3">
                <span className="text-[10px] uppercase font-semibold text-[#8B6D43] tracking-wider block mb-1">
                  Orders Count
                </span>
                <span className="font-serif text-lg font-bold text-[#2D2A26]">
                  {customer.ordersCount} completed
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8B6D43]">
                Contact & Location
              </h4>
              <div className="flex items-center gap-2 text-[#2D2A26]/80">
                <Mail className="h-3.5 w-3.5 text-[#8B6D43]" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/80">
                <Phone className="h-3.5 w-3.5 text-[#8B6D43]" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/80">
                <MapPin className="h-3.5 w-3.5 text-[#8B6D43]" />
                <span>{customer.city || "Bengaluru"}, {customer.state || "India"}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/50 text-[11px] pt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Customer since {customer.joinedDate}</span>
              </div>
            </div>

            {/* Account Status / Blocking */}
            <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="block font-semibold text-xs text-[#2D2A26]">Account Status</span>
                <span className={`text-[11px] font-bold ${customer.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"}`}>
                  {customer.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleBlock(customer.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  customer.status === "ACTIVE"
                    ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {customer.status === "ACTIVE" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{customer.status === "ACTIVE" ? "Block Patron" : "Unblock Patron"}</span>
              </button>
            </div>

            {/* Staff Notes */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8B6D43]">
                Dispensary Staff Notes
              </h4>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record customer preferences or allergy notes..."
                  className="flex-1 px-3 py-2 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#8B6D43] text-white rounded-xl text-xs font-semibold hover:bg-[#735732] transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              <div className="space-y-2">
                {(!customer.notes || customer.notes.length === 0) ? (
                  <p className="text-[#2D2A26]/40 text-center py-4">No notes recorded yet.</p>
                ) : (
                  customer.notes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs">
                      {note}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
