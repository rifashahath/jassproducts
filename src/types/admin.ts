/**
 * Admin Panel & E-Commerce Data Models for Jass Products Apothecary Console.
 * Tailored for Ayurvedic botanical formulations, inventory management, and fulfillment.
 */

import { type Product } from "../lib/products.ts";
import { type UserRole } from "../lib/roles.ts";

export type { UserRole };

export interface ExtendedProduct extends Product {
  sku: string;
  barcode: string;
  shortDescription?: string;
  costPrice: number;
  salePrice?: number;
  gstRate: number; // e.g. 18%
  hsnCode: string;
  brand: string;
  subcategory: string;
  tags: string[];
  stockQuantity: number;
  minStockThreshold: number;
  maxStockLimit: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "SCHEDULED";
  scheduledDate?: string;
  weight: number; // in kg
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  slug: string;
  history?: {
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

export type AdminOrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItemDetail {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  volume?: string;
}

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  status: AdminOrderStatus;
  paymentMethod: "UPI" | "COD" | "RAZORPAY" | "CARD" | "NETBANKING";
  paymentStatus: "PAID" | "PENDING" | "REFUNDED" | "FAILED";
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  courier?: string;
  awbNumber?: string;
  items: OrderItemDetail[];
  notes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description: string;
  image: string;
  bannerImage?: string;
  displayOrder: number;
  status: "ACTIVE" | "INACTIVE";
  productCount?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export type MovementType = "RESTOCK" | "DISPATCH" | "RETURN" | "DAMAGE" | "ADJUSTMENT" | "BREW_BATCH";

export interface StockMovementLog {
  id: string;
  productId: string | number;
  productName: string;
  sku: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  type: MovementType;
  reason: string;
  supplierName?: string;
  poNumber?: string;
  timestamp: string;
  user: string;
}

export type CustomerTier = "PATRON" | "BOTANICAL_GOLD" | "APOTHECARY_VIP";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  ordersCount: number;
  totalSpent: number;
  status: "ACTIVE" | "BLOCKED";
  joinedDate: string;
  lastOrderDate?: string;
  city?: string;
  state?: string;
  notes?: string[];
}

export interface PaymentTransactionRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  method: "UPI" | "RAZORPAY" | "COD" | "NETBANKING" | "CARD";
  status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  gatewayTxnId: string;
  fee: number;
  netAmount: number;
  createdAt: string;
}

export interface ShippingShipmentRecord {
  id: string;
  orderId: string;
  customerName: string;
  destinationCity: string;
  state: string;
  courier: "Delhivery" | "BlueDart" | "DTDC" | "India Post" | "Shiprocket";
  awbNumber: string;
  status: "MANIFESTED" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RTO";
  dispatchedAt: string;
  estimatedDelivery: string;
  weightKg: number;
}

export interface HeroBannerRecord {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  placement: "HERO_MAIN" | "MID_PAGE_STRIP" | "CATEGORY_HEADER";
  active: boolean;
  displayOrder: number;
  startsAt?: string;
  endsAt?: string;
}

export interface ReviewRecord {
  id: string;
  productId: string | number;
  productName: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  date: string;
  verifiedBuyer: boolean;
}

export interface StorefrontCmsConfig {
  announcementBarText: string;
  announcementBarActive: boolean;
  heroHeadline: string;
  heroSubheadline: string;
  footerTagline: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingAbove: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED";
  lastLogin: string;
  createdAt: string;
  department: string;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  user: string;
  ipAddress: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  details: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "ORDER" | "STOCK" | "SECURITY" | "SYSTEM";
  read: boolean;
  timestamp: string;
  link?: string;
}
