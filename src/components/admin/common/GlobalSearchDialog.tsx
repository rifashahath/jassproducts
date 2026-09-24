import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Layers,
  Boxes,
  CreditCard,
  Truck,
  Image as ImageIcon,
  Star,
  FileText,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { getStoredAdminProducts, getStoredAdminOrders, getStoredAdminCustomers } from "../../../features/admin/store/admin-store.ts";

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onNavigate(window.location.hash || "#admin");
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onNavigate]);

  if (!open) return null;

  const trimmed = query.trim().toLowerCase();

  // Navigation pages
  const navItems = [
    { label: "Dashboard Overview", path: "#admin", icon: BarChart3, group: "Navigation" },
    { label: "Product Management", path: "#admin/products", icon: Package, group: "Navigation" },
    { label: "Categories & Taxonomy", path: "#admin/categories", icon: Layers, group: "Navigation" },
    { label: "Inventory & Stock Control", path: "#admin/inventory", icon: Boxes, group: "Navigation" },
    { label: "Order Fulfillment", path: "#admin/orders", icon: ShoppingBag, group: "Navigation" },
    { label: "Customer Database CRM", path: "#admin/customers", icon: Users, group: "Navigation" },
    { label: "Payments & Settlements", path: "#admin/payments", icon: CreditCard, group: "Navigation" },
    { label: "Logistics & Shipping", path: "#admin/shipping", icon: Truck, group: "Navigation" },
    { label: "Banner Management", path: "#admin/banners", icon: ImageIcon, group: "Navigation" },
    { label: "Reviews & Ratings Moderation", path: "#admin/reviews", icon: Star, group: "Navigation" },
    { label: "Page & Policy CMS", path: "#admin/cms", icon: FileText, group: "Navigation" },
    { label: "Business Intelligence Reports", path: "#admin/reports", icon: BarChart3, group: "Navigation" },
    { label: "Staff & User Roles (RBAC)", path: "#admin/users", icon: Users, group: "Navigation" },
    { label: "Store Settings & Config", path: "#admin/settings", icon: Settings, group: "Navigation" },
    { label: "Security & Audit Logs", path: "#admin/security", icon: ShieldCheck, group: "Navigation" },
  ];

  const matchedNav = trimmed
    ? navItems.filter((item) => item.label.toLowerCase().includes(trimmed))
    : navItems.slice(0, 5);

  // Matched Products
  const allProds = getStoredAdminProducts();
  const matchedProds = trimmed
    ? allProds
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            p.category.toLowerCase().includes(trimmed) ||
            (p.sku && p.sku.toLowerCase().includes(trimmed))
        )
        .slice(0, 4)
    : [];

  // Matched Orders
  const allOrders = getStoredAdminOrders();
  const matchedOrders = trimmed
    ? allOrders
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(trimmed) ||
            o.customerName.toLowerCase().includes(trimmed) ||
            o.email.toLowerCase().includes(trimmed)
        )
        .slice(0, 3)
    : [];

  // Matched Customers
  const allCustomers = getStoredAdminCustomers();
  const matchedCustomers = trimmed
    ? allCustomers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(trimmed) ||
            c.email.toLowerCase().includes(trimmed) ||
            c.city?.toLowerCase().includes(trimmed)
        )
        .slice(0, 3)
    : [];

  const handleSelect = (path: string) => {
    onClose();
    onNavigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#FAF9F6] border border-[#D2C2AD] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E8E1D5] bg-[#FAF8F5] flex items-center gap-3">
          <Search className="h-5 w-5 text-[#8B6D43] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers, or modules... (ESC to exit)"
            className="w-full bg-transparent text-sm text-[#2D2A26] placeholder:text-[#2D2A26]/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-[#2D2A26]/40 hover:text-[#2D2A26]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#8B6D43] bg-[#F4EFE6] border border-[#D2C2AD]/60 rounded-md">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 divide-y divide-[#E8E1D5]/60">
          {/* Navigation Items */}
          {matchedNav.length > 0 && (
            <div className="pt-2 first:pt-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6D43] px-3 mb-1.5">
                Console Navigation
              </p>
              <div className="space-y-1">
                {matchedNav.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-[#8B6D43]" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8B6D43] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {matchedProds.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6D43] px-3 mb-1.5">
                Botanical Products
              </p>
              <div className="space-y-1">
                {matchedProds.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelect("#admin/products")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="h-7 w-7 rounded-lg object-cover bg-[#F4EFE6] border border-[#D2C2AD]/40"
                      />
                      <div>
                        <span className="block font-semibold">{prod.name}</span>
                        <span className="text-[10px] text-[#8B6D43] font-mono">
                          {prod.sku} • ₹{prod.price}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#F4EFE6] px-2 py-0.5 rounded-md text-[#8B6D43]">
                      {prod.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {matchedOrders.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6D43] px-3 mb-1.5">
                Orders
              </p>
              <div className="space-y-1">
                {matchedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelect("#admin/orders")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer group"
                  >
                    <div>
                      <span className="block font-semibold font-mono text-[#8B6D43]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-[#2D2A26]/70">
                        {ord.customerName} • ₹{ord.total}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#D2C2AD]/60">
                      {ord.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {matchedCustomers.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6D43] px-3 mb-1.5">
                Patrons & Customers
              </p>
              <div className="space-y-1">
                {matchedCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelect("#admin/customers")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer group"
                  >
                    <div>
                      <span className="block font-semibold">{cust.name}</span>
                      <span className="text-[11px] text-[#2D2A26]/70">
                        {cust.email} • {cust.city || "India"}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#8B6D43] font-semibold">
                      {cust.tier.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E1D5] flex items-center justify-between text-[11px] text-[#2D2A26]/60">
          <span>Tip: Press Cmd+K anytime to summon quick search</span>
          <span className="font-mono text-[#8B6D43]">Jass Apothecary Console</span>
        </div>
      </div>
    </div>
  );
};
