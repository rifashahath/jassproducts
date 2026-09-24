import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Plus,
  CircleUser,
  Shield,
  ChevronDown,
  ExternalLink,
  Package,
  Boxes,
  ShoppingBag,
  LogOut,
  Check,
} from "lucide-react";
import { getStoredAdminNotifications } from "../../../features/admin/store/admin-store.ts";
import { useAuth } from "../../../context/AuthContext.tsx";

interface AdminHeaderProps {
  currentSubpath: string;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onNavigate: (path: string) => void;
  onQuickAddProduct?: () => void;
  onQuickStockAdjust?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSubpath,
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
  onNavigate,
  onQuickAddProduct,
  onQuickStockAdjust,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    const notifs = getStoredAdminNotifications();
    return notifs.filter((n) => !n.read).length;
  });
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const quickRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCount = () => {
      const notifs = getStoredAdminNotifications();
      setUnreadCount(notifs.filter((n) => !n.read).length);
    };
    window.addEventListener("notifications_updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("notifications_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (currentSubpath) {
      case "products":
        return "Product Management";
      case "categories":
        return "Categories & Taxonomy";
      case "inventory":
        return "Stock & Inventory Control";
      case "orders":
        return "Order Fulfillment";
      case "customers":
        return "Customer Database CRM";
      case "payments":
        return "Payments & Settlements";
      case "shipping":
        return "Logistics & Shipping";
      case "banners":
        return "Banner Showcase";
      case "reviews":
        return "Reviews & Ratings";
      case "cms":
        return "Page & Policy CMS";
      case "reports":
        return "Business Intelligence";
      case "users":
        return "Staff & User Roles";
      case "settings":
        return "Store Configuration";
      case "security":
        return "Security & Audit Logs";
      default:
        return "Dashboard Overview";
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E1D5] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8B6D43] font-semibold uppercase tracking-wider hidden sm:inline">
            Console
          </span>
          <span className="text-[#2D2A26]/40 hidden sm:inline">/</span>
          <span className="font-serif font-bold text-sm text-[#2D2A26]">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Middle: Search Trigger */}
      <div className="flex-1 max-w-xs sm:max-w-sm mx-3 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D2C2AD]/70 rounded-xl text-xs text-[#2D2A26]/50 hover:border-[#8B6D43] transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#8B6D43]" />
            <span>Search records, products, orders...</span>
          </div>
          <span className="font-mono text-[10px] text-[#8B6D43] bg-[#F4EFE6] px-1.5 py-0.5 rounded border border-[#D2C2AD]/40">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-[#2D2A26] hover:bg-[#F4EFE6] md:hidden transition-colors"
          title="Search"
        >
          <Search className="h-5 w-5 text-[#8B6D43]" />
        </button>

        {/* Quick Actions Dropdown */}
        <div className="relative" ref={quickRef}>
          <button
            type="button"
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Action</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {quickMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#FAF9F6] border border-[#D2C2AD] rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  if (onQuickAddProduct) onQuickAddProduct();
                  else onNavigate("#admin/products");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer text-left"
              >
                <Package className="h-4 w-4 text-[#8B6D43]" />
                <span>Add Product</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  if (onQuickStockAdjust) onQuickStockAdjust();
                  else onNavigate("#admin/inventory");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer text-left"
              >
                <Boxes className="h-4 w-4 text-[#8B6D43]" />
                <span>Adjust Stock</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  onNavigate("#admin/orders");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer text-left"
              >
                <ShoppingBag className="h-4 w-4 text-[#8B6D43]" />
                <span>View Orders</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5 text-[#2D2A26]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#8B6D43] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile & Role Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#D2C2AD]/70 hover:border-[#8B6D43] bg-[#FFFFFF] transition-colors cursor-pointer shadow-2xs"
          >
            <div className="h-7 w-7 rounded-full bg-[#8B6D43] text-white flex items-center justify-center font-serif text-xs font-bold">
              {(user?.name || user?.email || "A").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block font-semibold text-xs text-[#2D2A26] leading-none">
                Dr. Jass
              </span>
              <span className="text-[10px] text-[#8B6D43] font-mono leading-tight">
                {(user?.role ?? "").replace("_", " ")}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-[#2D2A26]/50" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FAF9F6] border border-[#D2C2AD] rounded-2xl shadow-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="pb-3 border-b border-[#E8E1D5]">
                <p className="font-serif font-bold text-sm text-[#2D2A26]">Dr. Jass</p>
                <p className="text-[11px] text-[#8B6D43] font-mono">dr.jass@jassproducts.com</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4EFE6] border border-[#D2C2AD]/50 text-[10px] font-semibold text-[#8B6D43]">
                  <Shield className="h-3 w-3" />
                  <span>Role: {user?.role}{isAdmin ? "" : " (restricted)"}</span>
                </div>
              </div>

              {/* Storefront return link */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigate("#home");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[#8B6D43] hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer text-left"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Return to Public Store</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await signOut();
                    onNavigate("#home");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
