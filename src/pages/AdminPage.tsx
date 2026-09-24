import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/admin/layout/AdminLayout.tsx";

// Views
import { DashboardView } from "../components/admin/views/DashboardView.tsx";
import { ProductsView } from "../components/admin/views/ProductsView.tsx";
import { CategoriesView } from "../components/admin/views/CategoriesView.tsx";
import { InventoryView } from "../components/admin/views/InventoryView.tsx";
import { OrdersView } from "../components/admin/views/OrdersView.tsx";
import { CustomersView } from "../components/admin/views/CustomersView.tsx";
import { PaymentsView } from "../components/admin/views/PaymentsView.tsx";
import { ShippingView } from "../components/admin/views/ShippingView.tsx";
import { BannersView } from "../components/admin/views/BannersView.tsx";
import { ReviewsView } from "../components/admin/views/ReviewsView.tsx";
import { CmsView } from "../components/admin/views/CmsView.tsx";
import { ReportsView } from "../components/admin/views/ReportsView.tsx";
import { UsersView } from "../components/admin/views/UsersView.tsx";
import { SettingsView } from "../components/admin/views/SettingsView.tsx";
import { SecurityView } from "../components/admin/views/SecurityView.tsx";

// Modals & Drawers
import { ProductFormDialog } from "../components/admin/modals/ProductFormDialog.tsx";
import { StockAdjustmentModal } from "../components/admin/modals/StockAdjustmentModal.tsx";
import { StockTimelineDrawer } from "../components/admin/modals/StockTimelineDrawer.tsx";
import { OrderDetailDrawer } from "../components/admin/modals/OrderDetailDrawer.tsx";
import { PrintableOrderModal } from "../components/admin/modals/PrintableOrderModal.tsx";
import { CategoryFormDialog } from "../components/admin/modals/CategoryFormDialog.tsx";
import { CustomerDetailDrawer } from "../components/admin/modals/CustomerDetailDrawer.tsx";
import { BannerFormModal } from "../components/admin/modals/BannerFormModal.tsx";

// Store
import {
  saveProduct,
  saveCategory,
  saveStoredAdminBanners,
  getStoredAdminBanners,
  updateOrderStatus,
  addOrderStaffNote,
  toggleCustomerBlock,
  addCustomerNote,
  getStoredInventoryLogs,
} from "../features/admin/store/admin-store.ts";

import type {
  ExtendedProduct,
  AdminOrderRecord,
  CategoryItem,
  CustomerRecord,
  HeroBannerRecord,
  StockMovementLog,
} from "../types/admin.ts";

interface AdminPageProps {
  subpath?: string;
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ subpath = "dashboard", onNavigate }) => {
  // Normalize active subpath
  let normalizedSubpath = subpath;
  if (!normalizedSubpath || normalizedSubpath === "admin" || normalizedSubpath === "dashboard") {
    normalizedSubpath = "dashboard";
  }

  // Modals & Drawers State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);

  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<ExtendedProduct | null>(null);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState<StockMovementLog[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<AdminOrderRecord | null>(null);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBannerRecord | null>(null);

  useEffect(() => {
    setInventoryLogs(getStoredInventoryLogs());
  }, [isTimelineOpen]);

  // Handle Product Save
  const handleSaveProduct = async (productData: Partial<ExtendedProduct>) => {
    await saveProduct(productData);
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  // Handle Category Save
  const handleSaveCategory = async (catData: Partial<CategoryItem>) => {
    await saveCategory(catData);
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  };

  // Handle Banner Save
  const handleSaveBanner = async (bannerData: Partial<HeroBannerRecord>) => {
    const banners = getStoredAdminBanners();
    let updated: HeroBannerRecord[];
    if (bannerData.id) {
      updated = banners.map((b) => (b.id === bannerData.id ? { ...b, ...bannerData } as HeroBannerRecord : b));
    } else {
      const newBanner = {
        id: `ban-${Date.now()}`,
        title: bannerData.title || "New Showcase Banner",
        subtitle: bannerData.subtitle || "",
        ctaText: bannerData.ctaText || "Explore",
        ctaLink: bannerData.ctaLink || "#categories",
        imageUrl: bannerData.imageUrl || "/img-2.png",
        placement: bannerData.placement || "HERO_MAIN",
        active: bannerData.active ?? true,
        displayOrder: banners.length + 1,
      } as HeroBannerRecord;
      updated = [newBanner, ...banners];
    }
    saveStoredAdminBanners(updated);
    setIsBannerFormOpen(false);
    setEditingBanner(null);
  };

  // Render Subpath View
  const renderView = () => {
    switch (normalizedSubpath) {
      case "products":
        return (
          <ProductsView
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsProductFormOpen(true);
            }}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsProductFormOpen(true);
            }}
            onAdjustStock={(p) => {
              setStockAdjustProduct(p);
              setIsStockAdjustOpen(true);
            }}
          />
        );

      case "categories":
        return (
          <CategoriesView
            onOpenAddCategory={() => {
              setEditingCategory(null);
              setIsCategoryFormOpen(true);
            }}
            onEditCategory={(c) => {
              setEditingCategory(c);
              setIsCategoryFormOpen(true);
            }}
            onNavigate={onNavigate}
          />
        );

      case "inventory":
        return (
          <InventoryView
            onOpenAdjust={(p) => {
              setStockAdjustProduct(p || null);
              setIsStockAdjustOpen(true);
            }}
            onOpenTimeline={() => setIsTimelineOpen(true)}
          />
        );

      case "orders":
        return (
          <OrdersView
            onSelectOrder={(o) => setSelectedOrder(o)}
            onOpenInvoice={(o) => setInvoiceOrder(o)}
          />
        );

      case "customers":
        return (
          <CustomersView
            onSelectCustomer={(c) => setSelectedCustomer(c)}
          />
        );

      case "payments":
        return <PaymentsView />;

      case "shipping":
        return <ShippingView />;

      case "banners":
        return (
          <BannersView
            onOpenAddBanner={() => {
              setEditingBanner(null);
              setIsBannerFormOpen(true);
            }}
            onEditBanner={(b) => {
              setEditingBanner(b);
              setIsBannerFormOpen(true);
            }}
          />
        );

      case "reviews":
        return <ReviewsView />;

      case "cms":
        return <CmsView />;

      case "reports":
        return <ReportsView />;

      case "users":
        return <UsersView />;

      case "settings":
        return <SettingsView />;

      case "security":
        return <SecurityView />;

      case "dashboard":
      default:
        return (
          <DashboardView
            onNavigate={onNavigate}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsProductFormOpen(true);
            }}
            onOpenStockAdjust={() => {
              setStockAdjustProduct(null);
              setIsStockAdjustOpen(true);
            }}
            onSelectOrder={(o) => setSelectedOrder(o)}
          />
        );
    }
  };

  return (
    <AdminLayout
      currentSubpath={normalizedSubpath}
      onNavigate={onNavigate}
      onQuickAddProduct={() => {
        setEditingProduct(null);
        setIsProductFormOpen(true);
      }}
      onQuickStockAdjust={() => {
        setStockAdjustProduct(null);
        setIsStockAdjustOpen(true);
      }}
    >
      {renderView()}

      {/* Product Form Modal */}
      <ProductFormDialog
        open={isProductFormOpen}
        product={editingProduct}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={isStockAdjustOpen}
        product={stockAdjustProduct}
        onClose={() => {
          setIsStockAdjustOpen(false);
          setStockAdjustProduct(null);
        }}
        onSuccess={() => {
          setInventoryLogs(getStoredInventoryLogs());
        }}
      />

      {/* Stock Timeline Drawer */}
      <StockTimelineDrawer
        open={isTimelineOpen}
        logs={inventoryLogs}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={async (id, status, courier, awb) => {
          const updated = await updateOrderStatus(id, status, courier, awb);
          const current = updated.find((o) => o.id === id);
          if (current) setSelectedOrder(current);
        }}
        onAddNote={async (id, text) => {
          const updated = await addOrderStaffNote(id, text);
          const current = updated.find((o) => o.id === id);
          if (current) setSelectedOrder(current);
        }}
        onOpenInvoice={(o) => setInvoiceOrder(o)}
      />

      {/* Printable Invoice Modal */}
      <PrintableOrderModal
        open={!!invoiceOrder}
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={isCategoryFormOpen}
        categoryItem={editingCategory}
        onClose={() => {
          setIsCategoryFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={!!selectedCustomer}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onToggleBlock={async (id) => {
          const updated = await toggleCustomerBlock(id);
          const curr = updated.find((c) => c.id === id);
          if (curr) setSelectedCustomer(curr);
        }}
        onAddNote={async (id, note) => {
          const updated = await addCustomerNote(id, note);
          const curr = updated.find((c) => c.id === id);
          if (curr) setSelectedCustomer(curr);
        }}
      />

      {/* Banner Form Modal */}
      <BannerFormModal
        open={isBannerFormOpen}
        banner={editingBanner}
        onClose={() => {
          setIsBannerFormOpen(false);
          setEditingBanner(null);
        }}
        onSave={handleSaveBanner}
      />
    </AdminLayout>
  );
};
