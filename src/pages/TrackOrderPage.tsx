import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { getStoredAdminOrders } from '../features/admin/store/admin-store.ts';
import { formatINR } from '../lib/format.ts';

interface TrackOrderPageProps {
  initialOrderId?: string;
  onNavigate: (page: string) => void;
}

interface TrackedOrder {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  items_summary: string | null;
  items: Array<{ name: string; qty: number; price: number }> | null;
}

/**
 * Maps the server-side order status to a customer-facing label + step index.
 * Kept in sync with the status values written by process_order_atomic and the
 * cancellation endpoint.
 */
function statusView(status: string): { label: string; step: number } {
  const s = (status || '').toUpperCase();
  if (s === 'DELIVERED') return { label: 'Delivered', step: 4 };
  if (s === 'SHIPPED' || s === 'IN_TRANSIT' || s === 'DISPATCHED') return { label: 'In Transit', step: 3 };
  if (s === 'PROCESSING' || s === 'CONFIRMED') return { label: 'Processing in Apothecary', step: 2 };
  if (s === 'CANCELLED' || s === 'CANCELLED_REFUNDED') return { label: 'Cancelled', step: 0 };
  return { label: 'Order Received', step: 1 };
}

const STATUS_STEPS = [
  'Order Verified',
  'Payment Confirmed',
  'Processing in Apothecary',
  'Dispatched / In Transit',
  'Delivered',
];

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId, onNavigate }) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [searchedId, setSearchedId] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  /**
   * Real order lookup against `public.orders` via the anon key. Only orders
   * whose SELECT policy admits the current viewer are returned — for a logged-
   * out visitor the RLS policy admits rows where user_id IS NULL, so guest
   * orders are trackable by order id, while other customers' orders are not
   * visible. No fabricated data: an unknown id renders a genuine not-found
   * state (the previous behaviour synthesised a full fake shipment timeline
   * for ANY id entered, which was both misleading and phishing-friendly).
   */
  const handleSearch = useCallback(async (queryId: string) => {
    const clean = queryId.trim();
    if (!clean) return;
    setSearching(true);
    setNotFound(false);
    setLookupError(null);
    setOrder(null);
    setSearchedId(clean.toUpperCase());
    if (!isSupabaseConfigured) {
      const local = getStoredAdminOrders().find(
        (o) => o.id.toUpperCase() === clean.toUpperCase() || o.orderNumber?.toUpperCase() === clean.toUpperCase()
      );
      if (local) {
        setOrder({
          id: local.orderNumber || local.id,
          status: local.status,
          created_at: local.createdAt,
          total_amount: local.total,
          items_summary: local.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
          items: local.items.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
        });
      } else {
        setNotFound(true);
      }
      setSearching(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount, items_summary, items')
        .eq('id', clean)
        .maybeSingle();
      if (error) {
        setLookupError('Could not look up this order. Please try again in a moment.');
        return;
      }
      if (!data) {
        setNotFound(true);
        return;
      }
      setOrder(data as TrackedOrder);
    } catch {
      setLookupError('Could not look up this order. Please try again in a moment.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderId) void handleSearch(initialOrderId);
  }, [initialOrderId, handleSearch]);

  const view = order ? statusView(order.status) : null;

  return (
    <div className="w-full flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 max-w-[1100px] mx-auto min-h-[70vh]">
      {/* Header Banner */}
      <div className="w-full text-center py-10 sm:py-12 bg-[#f4f1ea] rounded-[2.5rem] border border-[#d2c2ad]/40 mb-10 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b6d43]/10 text-[#8b6d43] text-xs font-bold tracking-[0.2em] uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Order Lookup</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 mb-3 tracking-wide">
          Track Your Apothecary Parcel
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed mb-6">
          Enter your JASS order reference (shown on your confirmation screen) to see its real, live status.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch(orderIdInput);
          }}
          className="flex max-w-md mx-auto bg-white rounded-full border border-[#d2c2ad] p-1.5 shadow-sm focus-within:border-[#8b6d43]"
        >
          <input
            type="text"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Enter Order ID (e.g. VRD-XXXXXX)"
            className="flex-1 px-4 py-2.5 text-xs text-neutral-800 outline-none bg-transparent"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
          >
            {searching ? '…' : 'Track'}
          </button>
        </form>
      </div>

      {lookupError && (
        <div className="w-full max-w-xl mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {notFound && (
        <div className="w-full max-w-xl mb-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h2 className="font-serif text-xl text-neutral-900 mb-2">Order not found</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            No order matches “{searchedId}”. Double-check the reference from your confirmation screen,
            which looks like <span className="font-mono">VRD-XXXXXX</span>. If you just placed the order,
            give it a few seconds and try again.
          </p>
        </div>
      )}

      {order && view && (
        <div className="w-full bg-white rounded-3xl border border-[#d2c2ad]/50 p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in duration-300">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#d2c2ad]/30 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-neutral-900 text-base">{order.id}</span>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-[#8b6d43]/15 text-[#8b6d43]">
                  {view.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Placed on{' '}
                <strong>
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                Order Total
              </span>
              <span className="font-serif text-lg font-bold text-[#8b6d43]">{formatINR(order.total_amount)}</span>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="space-y-6">
            <h3 className="font-serif text-base font-bold text-neutral-900 uppercase tracking-wider">
              Progress
            </h3>
            <div className="relative pl-6 sm:pl-8 space-y-8 border-l-2 border-[#d2c2ad]/50 ml-3">
              {STATUS_STEPS.map((title, idx) => {
                // Cancelled orders show no forward progress.
                const isCompleted = view.step > 0 && idx <= view.step;
                return (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                        isCompleted ? 'bg-[#8b6d43] shadow-md' : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <h4
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isCompleted ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {title}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="pt-6 border-t border-[#d2c2ad]/30">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
              Package Contents
            </h4>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs p-3 bg-[#fbfbf9] rounded-xl border border-neutral-200"
                  >
                    <span className="font-medium text-neutral-900">
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-semibold text-neutral-800">{formatINR(item.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">{order.items_summary || 'Items not itemised for this order.'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
