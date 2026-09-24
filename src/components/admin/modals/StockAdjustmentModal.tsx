import React, { useState, useEffect } from "react";
import { X, Boxes, Plus, Minus, Check, AlertTriangle } from "lucide-react";
import type { ExtendedProduct, MovementType } from "../../../types/admin.ts";
import { getStoredAdminProducts, adjustProductStock } from "../../../features/admin/store/admin-store.ts";

interface StockAdjustmentModalProps {
  open: boolean;
  product?: ExtendedProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  open,
  product,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [type, setType] = useState<MovementType>("RESTOCK");
  const [quantity, setQuantity] = useState<number>(20);
  const [reason, setReason] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    if (open) {
      const list = getStoredAdminProducts();
      setProducts(list);
      if (product) {
        setSelectedId(String(product.id));
      } else if (list.length > 0) {
        setSelectedId(String(list[0].id));
      }
      setQuantity(20);
      setReason("");
      setSupplierName("");
      setPoNumber("");
    }
  }, [open, product]);

  if (!open) return null;

  const currentProduct = products.find((p) => String(p.id) === selectedId) || product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const delta =
      type === "DAMAGE" || type === "DISPATCH" ? -Math.abs(quantity) : Math.abs(quantity);

    await adjustProductStock(
      currentProduct.id,
      delta,
      type,
      reason || `Manual adjustment via Apothecary Console (${type})`,
      "Dr. Jass",
      supplierName || undefined,
      poNumber || undefined
    );

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#FAF9F6] border border-[#D2C2AD] rounded-[2rem] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/60 flex items-center justify-center text-[#8B6D43]">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                Adjust Dispensary Stock
              </h3>
              <p className="text-[11px] font-mono text-[#8B6D43] uppercase tracking-wider">
                Real-Time Inventory Reconciliation
              </p>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Select Formulation *
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.stockQuantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Movement Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MovementType)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              >
                <option value="RESTOCK">+ Restock (Lab Shipment)</option>
                <option value="BREW_BATCH">+ Batch Brew (Fresh Botanical Yield)</option>
                <option value="RETURN">+ Customer Return / Restock</option>
                <option value="DAMAGE">- Damaged Bottle / Quality Scrap</option>
                <option value="ADJUSTMENT">Audit Count Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Units Count *
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Reason / Quality Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Completed Nilgiris distillation batch 14..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Distillery / Supplier
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Nilgiris Herbal Lab"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Batch PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2026-904"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>

          {currentProduct && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#2D2A26]/70">New Expected Stock:</span>
              <strong className="text-sm font-bold text-[#8B6D43]">
                {type === "DAMAGE" || type === "DISPATCH"
                  ? Math.max(0, (currentProduct.stockQuantity || 0) - quantity)
                  : (currentProduct.stockQuantity || 0) + quantity}{" "}
                units
              </strong>
            </div>
          )}

          <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#2D2A26]/70 hover:text-[#2D2A26] hover:bg-[#F4EFE6] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Record Movement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
