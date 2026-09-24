import React from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  CreditCard,
  Truck,
  Image as ImageIcon,
  Star,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronRight,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  currentPath: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (path: string) => void;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  collapsed,
  mobileOpen,
  onNavigate,
  onCloseMobile,
}) => {
  const navGroups = [
    {
      title: "Core & Analytics",
      items: [
        {
          label: "Dashboard Overview",
          path: "#admin",
          subpath: "dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Catalog & Inventory",
      items: [
        {
          label: "Product Management",
          path: "#admin/products",
          subpath: "products",
          icon: Package,
        },
        {
          label: "Categories & Taxonomy",
          path: "#admin/categories",
          subpath: "categories",
          icon: Layers,
        },
        {
          label: "Stock & Inventory Control",
          path: "#admin/inventory",
          subpath: "inventory",
          icon: Boxes,
        },
      ],
    },
    {
      title: "Sales & Operations",
      items: [
        {
          label: "Order Fulfillment",
          path: "#admin/orders",
          subpath: "orders",
          icon: ShoppingBag,
        },
        {
          label: "Customer Database CRM",
          path: "#admin/customers",
          subpath: "customers",
          icon: Users,
        },
        {
          label: "Payments & Settlements",
          path: "#admin/payments",
          subpath: "payments",
          icon: CreditCard,
        },
        {
          label: "Logistics & Shipping",
          path: "#admin/shipping",
          subpath: "shipping",
          icon: Truck,
        },
      ],
    },
    {
      title: "Marketing & Content",
      items: [
        {
          label: "Banner Management",
          path: "#admin/banners",
          subpath: "banners",
          icon: ImageIcon,
        },
        {
          label: "Reviews & Ratings",
          path: "#admin/reviews",
          subpath: "reviews",
          icon: Star,
        },
        {
          label: "Page & Policy CMS",
          path: "#admin/cms",
          subpath: "cms",
          icon: FileText,
        },
      ],
    },
    {
      title: "Administration & Security",
      items: [
        {
          label: "Reports & Intelligence",
          path: "#admin/reports",
          subpath: "reports",
          icon: BarChart3,
        },
        {
          label: "Staff & User Roles",
          path: "#admin/users",
          subpath: "users",
          icon: Users,
        },
        {
          label: "Store Configuration",
          path: "#admin/settings",
          subpath: "settings",
          icon: Settings,
        },
        {
          label: "Security & Audit Logs",
          path: "#admin/security",
          subpath: "security",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#FAF8F5] border-r border-[#E8E1D5]">
      {/* Brand Header */}
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-[#E8E1D5] bg-[#F4EFE6]/60">
        <div
          onClick={() => handleLinkClick("#admin")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-[#8B6D43] text-white flex items-center justify-center font-serif text-base font-bold shadow-xs">
            J
          </div>
          {!collapsed && (
            <div>
              <span className="font-serif font-bold text-sm tracking-wide text-[#2D2A26] block leading-tight">
                JASS AYURVEDA
              </span>
              <span className="text-[10px] text-[#8B6D43] tracking-widest uppercase block font-mono font-semibold">
                Apothecary Console
              </span>
            </div>
          )}
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-[#2D2A26]/60 hover:text-[#2D2A26] md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[#8B6D43] px-3 mb-2 tracking-[0.16em] uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.path === "#admin"
                    ? currentPath === "#admin" || currentPath === "admin" || currentPath === "#admin/"
                    : currentPath.includes(item.subpath);

                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => handleLinkClick(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? "bg-[#8B6D43] text-white font-semibold shadow-xs"
                          : "text-[#2D2A26]/75 hover:text-[#2D2A26] hover:bg-[#F4EFE6]"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-white" : "text-[#8B6D43]"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer Link to Public Storefront */}
      <div className="p-3 border-t border-[#E8E1D5] bg-[#F4EFE6]/50">
        <button
          type="button"
          onClick={() => onNavigate("#home")}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[#D2C2AD]/70 bg-white text-xs font-semibold text-[#2D2A26] hover:text-[#8B6D43] hover:border-[#8B6D43] transition-colors cursor-pointer shadow-2xs"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-[#8B6D43]" />
            {!collapsed && <span>View Online Store</span>}
          </span>
          {!collapsed && <ChevronRight className="h-3.5 w-3.5 text-[#2D2A26]/40" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 max-w-xs w-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
