import React from "react";
import { X, History, Plus, Minus, AlertTriangle, Boxes, CheckCircle2 } from "lucide-react";
import type { StockMovementLog } from "../../../types/admin.ts";

interface StockTimelineDrawerProps {
  open: boolean;
  logs: StockMovementLog[];
  onClose: () => void;
}

export const StockTimelineDrawer: React.FC<StockTimelineDrawerProps> = ({
  open,
  logs,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] border-l border-[#E8E1D5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-[#E8E1D5] bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/50 flex items-center justify-center text-[#8B6D43]">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#2D2A26]">
                  Stock Audit Timeline
                </h3>
                <p className="text-[11px] text-[#8B6D43] font-medium">
                  {logs.length} logged inventory movements
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

          {/* Timeline Entries */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-[#2D2A26]/40">
                <Boxes className="h-8 w-8 mx-auto mb-2 text-[#8B6D43]/30" />
                <p className="font-serif text-sm text-[#2D2A26]">No movements recorded</p>
                <p className="text-[11px] text-[#2D2A26]/40 mt-1">
                  Adjustments will generate permanent audit trails.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E1D5]">
                {logs.map((log) => {
                  const isPositive = log.quantityChange > 0;
                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          isPositive ? "bg-[#8B6D43]" : "bg-rose-500"
                        }`}
                      />

                      <div className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif font-bold text-xs text-[#2D2A26]">
                            {log.productName}
                          </span>
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange} units
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8B6D43] font-mono">
                          <span>{log.sku}</span>
                          <span>•</span>
                          <span>{log.type.replace("_", " ")}</span>
                        </div>

                        <p className="mt-2 text-xs text-[#2D2A26]/80 leading-relaxed">
                          {log.reason}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-[#E8E1D5]/60 flex items-center justify-between text-[10px] text-[#2D2A26]/50">
                          <span>By: {log.user}</span>
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
