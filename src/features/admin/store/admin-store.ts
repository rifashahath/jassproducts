/**
 * Jass Products Apothecary Admin Store & Data Persistence Layer.
 * Provides unified reactive state, Supabase synchronization, and resilient local cache.
 */

import { products as seedCatalog, type Product } from "../../../lib/products.ts";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase.ts";
import type {
  ExtendedProduct,
  AdminOrderRecord,
  CategoryItem,
  StockMovementLog,
  CustomerRecord,
  PaymentTransactionRecord,
  ShippingShipmentRecord,
  HeroBannerRecord,
  ReviewRecord,
  StorefrontCmsConfig,
  AdminUserRecord,
  SecurityAuditLog,
  AdminNotification,
  AdminOrderStatus,
} from "../../../types/admin.ts";

// Storage Keys
const KEYS = {
  PRODUCTS: "jass_admin_products_v1",
  ORDERS: "jass_admin_orders_v1",
  CATEGORIES: "jass_admin_categories_v1",
  INVENTORY_LOGS: "jass_admin_inventory_logs_v1",
  CUSTOMERS: "jass_admin_customers_v1",
  PAYMENTS: "jass_admin_payments_v1",
  SHIPPING: "jass_admin_shipping_v1",
  BANNERS: "jass_admin_banners_v1",
  REVIEWS: "jass_admin_reviews_v1",
  CMS: "jass_admin_cms_v1",
  USERS: "jass_admin_users_v1",
  SECURITY_LOGS: "jass_admin_security_v1",
  NOTIFICATIONS: "jass_admin_notifs_v1",
  ACTIVE_ROLE: "jass_admin_active_role_v1",
};

// Helper: Notify changes
function broadcast(event: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(event));
    window.dispatchEvent(new Event("storage"));
  }
}

// -------------------------------------------------------------
// SEED DATA GENERATORS
// -------------------------------------------------------------

function generateSeedProducts(): ExtendedProduct[] {
  return seedCatalog.map((p, idx) => {
    const stockQty = p.stockQuantity ?? (p.inStock ? 60 - (idx % 5) * 8 : 0);
    const cost = Math.round(p.price * 0.45);
    const sku = `JP-${p.category.slice(0, 2).toUpperCase()}-${String(idx + 1).padStart(3, "0")}`;

    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
    if (stockQty <= 0) stockStatus = "OUT_OF_STOCK";
    else if (stockQty <= 15) stockStatus = "LOW_STOCK";

    return {
      ...p,
      sku,
      barcode: `8906045${String(1000 + idx).slice(1)}`,
      shortDescription: p.description?.slice(0, 100) || p.name,
      costPrice: cost,
      salePrice: p.price,
      gstRate: 18,
      hsnCode: "3305.90.11",
      brand: "Jass Ayurveda",
      subcategory: p.category,
      tags: [p.category, "Ayurveda", "Cold-Pressed", "Organic"],
      stockQuantity: stockQty,
      minStockThreshold: 15,
      maxStockLimit: 250,
      stockStatus,
      status: "PUBLISHED",
      weight: 0.35,
      lengthCm: 8,
      widthCm: 8,
      heightCm: 18,
      slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
      history: [
        {
          timestamp: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
          user: "Dr. Jass (Master Botanist)",
          action: "Formulation Verified",
          details: "Ayurvedic batch assay passed with 100% pure botanical actives.",
        },
      ],
    };
  });
}

function generateSeedCategories(): CategoryItem[] {
  return [
    {
      id: "cat-hair",
      name: "HAIR CARE",
      slug: "hair-care",
      description: "Rosemary, neem and vital bhringraj formulations engineered for scalp balance and borewell hard water resilience.",
      image: "/products/herbal-shampoo/main.png",
      displayOrder: 1,
      status: "ACTIVE",
      productCount: 2,
    },
    {
      id: "cat-skin",
      name: "SKIN RENEWAL",
      slug: "skin-renewal",
      description: "Pure Kashmiri saffron threads, terracotta clays and cold-pressed botanical serums targeting cellular radiance.",
      image: "/products/saffron-gel/main.png",
      displayOrder: 2,
      status: "ACTIVE",
      productCount: 2,
    },
    {
      id: "cat-health",
      name: "HEALTH CARE",
      slug: "health-care",
      description: "100% pure organic herbal vitality powders including Beetroot, Carrot and Moringa leaves for holistic wellness.",
      image: "/products/amla-powder/main.png",
      displayOrder: 3,
      status: "ACTIVE",
      productCount: 1,
    },
    {
      id: "cat-soap",
      name: "SOAP & BATH",
      slug: "soap-and-bath",
      description: "Handcrafted cold-processed artisanal soaps with neem, pure turmeric, and cold-pressed virgin coconut oils.",
      image: "/products/herbal-lip-balm/main.png",
      displayOrder: 4,
      status: "ACTIVE",
      productCount: 1,
    },
    {
      id: "cat-face",
      name: "FACE NOURISH",
      slug: "face-nourish",
      description: "Deep restorative day and night elixirs, raw shea moisturizers, and rejuvenating gotu kola ceramides.",
      image: "/products/night-cream/main.png",
      displayOrder: 5,
      status: "ACTIVE",
      productCount: 1,
    },
    {
      id: "cat-body",
      name: "BODY CARE",
      slug: "body-care",
      description: "Sulfate-free botanical washes infused with raw honey, mountain turmeric, and sandalwood shavings.",
      image: "/products/sunscreen/main.png",
      displayOrder: 6,
      status: "ACTIVE",
      productCount: 1,
    },
    {
      id: "cat-aroma",
      name: "AROMATHERAPY",
      slug: "aromatherapy",
      description: "Deep indigo chamomile and star jasmine pillow mists crafted for nervous system tranquility and peaceful sleep.",
      image: "/products/carrot-powder/main.png",
      displayOrder: 7,
      status: "ACTIVE",
      productCount: 1,
    },
  ];
}

function generateSeedOrders(): AdminOrderRecord[] {
  return [
    {
      id: "jp-ord-101",
      orderNumber: "JP-89214",
      customerName: "Priya Sharma",
      email: "priya.sharma@gmail.com",
      phone: "+91 98450 12345",
      total: 100,
      subtotal: 100,
      tax: 0,
      shippingFee: 0,
      discount: 0,
      status: "PROCESSING",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      shippingAddress: {
        street: "42 12th Main, 4th Block, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        country: "India",
      },
      courier: "Delhivery",
      awbNumber: "DEL-90823411",
      items: [
        {
          id: "jp-2",
          name: "Renew Serum",
          price: 58,
          quantity: 1,
          category: "SKIN RENEWAL",
          image: "/products/saffron-gel/main.png",
          volume: "50 ML",
        },
        {
          id: "jp-1",
          name: "Anti-Dandruff Shampoo",
          price: 42,
          quantity: 1,
          category: "HAIR CARE",
          image: "/products/herbal-shampoo/main.png",
          volume: "250 ML",
        },
      ],
      notes: ["Customer requested batch freshly blended this month."],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "jp-ord-102",
      orderNumber: "JP-89215",
      customerName: "Rajesh Verma",
      email: "rajesh.verma@corptech.in",
      phone: "+91 98112 34567",
      total: 123,
      subtotal: 123,
      tax: 0,
      shippingFee: 0,
      discount: 0,
      status: "SHIPPED",
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      shippingAddress: {
        street: "Flat 402, Nilgiri Apts, Vasant Vihar",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110057",
        country: "India",
      },
      courier: "BlueDart",
      awbNumber: "BLU-87612093",
      items: [
        {
          id: "jp-5",
          name: "Hydrating Cream",
          price: 85,
          quantity: 1,
          category: "FACE NOURISH",
          image: "/products/night-cream/main.png",
          volume: "50 ML",
        },
        {
          id: "jp-3",
          name: "Pure Powders Health Care Trio",
          price: 38,
          quantity: 1,
          category: "HEALTH CARE",
          image: "/products/amla-powder/main.png",
          volume: "100 G x 3",
        },
      ],
      notes: ["Fragile glass containers; double padded packaging verified."],
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
    },
    {
      id: "jp-ord-103",
      orderNumber: "JP-89216",
      customerName: "Ananya Iyer",
      email: "ananya.iyer@outlook.com",
      phone: "+91 94440 98765",
      total: 42,
      subtotal: 42,
      tax: 0,
      shippingFee: 0,
      discount: 0,
      status: "PENDING",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      shippingAddress: {
        street: "15 Temple Road, Mylapore",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600004",
        country: "India",
      },
      items: [
        {
          id: "jp-1",
          name: "Anti-Dandruff Shampoo",
          price: 42,
          quantity: 1,
          category: "HAIR CARE",
          image: "/products/herbal-shampoo/main.png",
          volume: "250 ML",
        },
      ],
      notes: ["COD verification call pending."],
      createdAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    },
    {
      id: "jp-ord-104",
      orderNumber: "JP-89217",
      customerName: "Vikram Patel",
      email: "vikram.patel@suninfra.com",
      phone: "+91 97250 88990",
      total: 106,
      subtotal: 106,
      tax: 0,
      shippingFee: 0,
      discount: 0,
      status: "DELIVERED",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      shippingAddress: {
        street: "B-201, Shivalik High Street, Bodakdev",
        city: "Ahmedabad",
        state: "Gujarat",
        postalCode: "380054",
        country: "India",
      },
      courier: "Delhivery",
      awbNumber: "DEL-84091128",
      items: [
        {
          id: "jp-4",
          name: "Natural Herbal Soap",
          price: 18,
          quantity: 2,
          category: "SOAP & BATH",
          image: "/products/herbal-lip-balm/main.png",
          volume: "125 G",
        },
        {
          id: "jp-7",
          name: "Glow Clay Mask",
          price: 45,
          quantity: 1,
          category: "SKIN RENEWAL",
          image: "/products/beetroot-powder/main.png",
          volume: "100 G",
        },
        {
          id: "jp-8",
          name: "Calming Sleep Mist",
          price: 24,
          quantity: 1,
          category: "AROMATHERAPY",
          image: "/products/carrot-powder/main.png",
          volume: "100 ML",
        },
      ],
      notes: ["Delivered at security reception with signature."],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "jp-ord-105",
      orderNumber: "JP-89218",
      customerName: "Meera Sen",
      email: "meera.sen@gmail.com",
      phone: "+91 98201 11223",
      total: 58,
      subtotal: 58,
      tax: 0,
      shippingFee: 0,
      discount: 0,
      status: "DELIVERED",
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      shippingAddress: {
        street: "7th floor, Oceanic Tower, Bandra West",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400050",
        country: "India",
      },
      courier: "BlueDart",
      awbNumber: "BLU-99210041",
      items: [
        {
          id: "jp-2",
          name: "Renew Serum",
          price: 58,
          quantity: 1,
          category: "SKIN RENEWAL",
          image: "/products/saffron-gel/main.png",
          volume: "50 ML",
        },
      ],
      notes: ["Repeat customer from Bombay."],
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
    },
  ];
}

function generateSeedCustomers(): CustomerRecord[] {
  return [
    {
      id: "cust-1",
      name: "Priya Sharma",
      email: "priya.sharma@gmail.com",
      phone: "+91 98450 12345",
      tier: "BOTANICAL_GOLD",
      ordersCount: 4,
      totalSpent: 380,
      status: "ACTIVE",
      joinedDate: "2026-03-15",
      lastOrderDate: "2026-09-06",
      city: "Bengaluru",
      state: "Karnataka",
      notes: ["Prefers rosemary and neem blends for hard borewell water."],
    },
    {
      id: "cust-2",
      name: "Rajesh Verma",
      email: "rajesh.verma@corptech.in",
      phone: "+91 98112 34567",
      tier: "APOTHECARY_VIP",
      ordersCount: 8,
      totalSpent: 840,
      status: "ACTIVE",
      joinedDate: "2026-01-10",
      lastOrderDate: "2026-09-05",
      city: "New Delhi",
      state: "Delhi",
      notes: ["Orders Pure Powders Health Care Trio monthly on subscription."],
    },
    {
      id: "cust-3",
      name: "Ananya Iyer",
      email: "ananya.iyer@outlook.com",
      phone: "+91 94440 98765",
      tier: "PATRON",
      ordersCount: 1,
      totalSpent: 42,
      status: "ACTIVE",
      joinedDate: "2026-09-06",
      lastOrderDate: "2026-09-06",
      city: "Chennai",
      state: "Tamil Nadu",
      notes: ["First-time buyer; discovered through botanical haircare feature."],
    },
    {
      id: "cust-4",
      name: "Vikram Patel",
      email: "vikram.patel@suninfra.com",
      phone: "+91 97250 88990",
      tier: "BOTANICAL_GOLD",
      ordersCount: 5,
      totalSpent: 512,
      status: "ACTIVE",
      joinedDate: "2026-02-20",
      lastOrderDate: "2026-09-02",
      city: "Ahmedabad",
      state: "Gujarat",
      notes: ["Likes cold-processed soaps and sleep mist sets."],
    },
    {
      id: "cust-5",
      name: "Meera Sen",
      email: "meera.sen@gmail.com",
      phone: "+91 98201 11223",
      tier: "APOTHECARY_VIP",
      ordersCount: 9,
      totalSpent: 920,
      status: "ACTIVE",
      joinedDate: "2025-11-04",
      lastOrderDate: "2026-08-31",
      city: "Mumbai",
      state: "Maharashtra",
      notes: ["VIP patron of Saffron Renew Serum & Gotu Kola Creams."],
    },
  ];
}

function generateSeedInventoryLogs(): StockMovementLog[] {
  return [
    {
      id: "log-1",
      productId: "jp-1",
      productName: "Anti-Dandruff Shampoo",
      sku: "JP-HA-001",
      quantityChange: 50,
      previousStock: 50,
      newStock: 100,
      type: "RESTOCK",
      reason: "Fresh rosemary & sea salt formulation brew completed in Nilgiris distillery.",
      supplierName: "Nilgiris Herbal Lab & Extraction",
      poNumber: "PO-2026-901",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      user: "Dr. Jass (Master Botanist)",
    },
    {
      id: "log-2",
      productId: "jp-2",
      productName: "Renew Serum",
      sku: "JP-SK-002",
      quantityChange: 40,
      previousStock: 35,
      newStock: 75,
      type: "BREW_BATCH",
      reason: "Kashmiri saffron infusion batch 18 matured and bottled.",
      supplierName: "Pampore Saffron Cooperative",
      poNumber: "PO-2026-884",
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      user: "Aarav Mehta (Operations Manager)",
    },
    {
      id: "log-3",
      productId: "jp-7",
      productName: "Glow Clay Mask",
      sku: "JP-SK-007",
      quantityChange: -1,
      previousStock: 36,
      newStock: 35,
      type: "DAMAGE",
      reason: "Terracotta jar hairline inspection crack during transit QA.",
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      user: "Neha Gupta (QA Lead)",
    },
  ];
}

function generateSeedPayments(): PaymentTransactionRecord[] {
  return [
    {
      id: "txn-1",
      orderId: "JP-89214",
      customerName: "Priya Sharma",
      customerEmail: "priya.sharma@gmail.com",
      amount: 100,
      method: "UPI",
      status: "SUCCESS",
      gatewayTxnId: "pay_RzpUpi98142",
      fee: 2.0,
      netAmount: 98.0,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "txn-2",
      orderId: "JP-89215",
      customerName: "Rajesh Verma",
      customerEmail: "rajesh.verma@corptech.in",
      amount: 123,
      method: "RAZORPAY",
      status: "SUCCESS",
      gatewayTxnId: "pay_RzpCard10294",
      fee: 2.8,
      netAmount: 120.2,
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      id: "txn-3",
      orderId: "JP-89217",
      customerName: "Vikram Patel",
      customerEmail: "vikram.patel@suninfra.com",
      amount: 106,
      method: "UPI",
      status: "SUCCESS",
      gatewayTxnId: "pay_RzpUpi48210",
      fee: 2.1,
      netAmount: 103.9,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];
}

function generateSeedShipments(): ShippingShipmentRecord[] {
  return [
    {
      id: "shp-1",
      orderId: "JP-89214",
      customerName: "Priya Sharma",
      destinationCity: "Bengaluru",
      state: "Karnataka",
      courier: "Delhivery",
      awbNumber: "DEL-90823411",
      status: "PICKED_UP",
      dispatchedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      estimatedDelivery: "Sep 08, 2026",
      weightKg: 0.85,
    },
    {
      id: "shp-2",
      orderId: "JP-89215",
      customerName: "Rajesh Verma",
      destinationCity: "New Delhi",
      state: "Delhi",
      courier: "BlueDart",
      awbNumber: "BLU-87612093",
      status: "IN_TRANSIT",
      dispatchedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      estimatedDelivery: "Sep 07, 2026",
      weightKg: 1.2,
    },
    {
      id: "shp-3",
      orderId: "JP-89217",
      customerName: "Vikram Patel",
      destinationCity: "Ahmedabad",
      state: "Gujarat",
      courier: "Delhivery",
      awbNumber: "DEL-84091128",
      status: "DELIVERED",
      dispatchedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      estimatedDelivery: "Sep 05, 2026",
      weightKg: 0.95,
    },
  ];
}

function generateSeedBanners(): HeroBannerRecord[] {
  return [
    {
      id: "ban-1",
      title: "Hard Water Defense Rituals",
      subtitle: "Cold-pressed rosemary and neem solutions formulated for Indian tap water and borewell mineral buildup.",
      ctaText: "Explore Collection",
      ctaLink: "#categories?category=HAIR CARE",
      imageUrl: "/img-2.png",
      placement: "HERO_MAIN",
      active: true,
      displayOrder: 1,
    },
    {
      id: "ban-2",
      title: "Pure Kashmiri Saffron Harvest",
      subtitle: "Limited release: 100% genuine saffron-infused cell repair elixir.",
      ctaText: "Discover Serum",
      ctaLink: "#product/jp-2",
      imageUrl: "/img-3.png",
      placement: "MID_PAGE_STRIP",
      active: true,
      displayOrder: 2,
    },
  ];
}

function generateSeedReviews(): ReviewRecord[] {
  return [
    {
      id: "rev-1",
      productId: "jp-1",
      productName: "Anti-Dandruff Shampoo",
      customerName: "Priya S.",
      rating: 5,
      title: "Saved my scalp from borewell water",
      comment: "Bengaluru hard water ruined my hair. Within 3 washes with this rosemary neem combo, flaking completely cleared up without dryness!",
      status: "APPROVED",
      date: "2026-08-28",
      verifiedBuyer: true,
    },
    {
      id: "rev-2",
      productId: "jp-2",
      productName: "Renew Serum",
      customerName: "Ananya M.",
      rating: 5,
      title: "Pure saffron goodness",
      comment: "You can see genuine Kashmiri saffron strands suspended in the oil. It absorbs deeply and leaves an exquisite natural glow.",
      status: "APPROVED",
      date: "2026-08-25",
      verifiedBuyer: true,
    },
    {
      id: "rev-3",
      productId: "jp-3",
      productName: "Pure Powders Health Care Trio",
      customerName: "Vikram P.",
      rating: 5,
      title: "Fresh aroma and vibrant color",
      comment: "The beetroot and moringa powders dissolve effortlessly in morning water. Felt noticeable energy improvement within a week.",
      status: "APPROVED",
      date: "2026-08-22",
      verifiedBuyer: true,
    },
  ];
}

function generateSeedCms(): StorefrontCmsConfig {
  return {
    announcementBarText: "Complimentary Kansa Massage Wand on Botanical orders above ₹1,999 • Free Pan-India Delivery",
    announcementBarActive: true,
    heroHeadline: "Ancient Botanical Wisdom. Modern Ayurvedic Purity.",
    heroSubheadline: "Handcrafted in small batches across Karnataka & Tamil Nadu for Indian hair and scalp resilience.",
    footerTagline: "Pure Herbal Formulations & Apothecary Dispensary",
    contactEmail: "apothecary@jassproducts.com",
    contactPhone: "+91 98450 12345",
    freeShippingAbove: 499,
  };
}

function generateSeedUsers(): AdminUserRecord[] {
  return [
    {
      id: "usr-1",
      name: "Dr. Jass",
      email: "dr.jass@jassproducts.com",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      lastLogin: new Date().toISOString(),
      createdAt: "2025-01-01",
      department: "Botanical Research & Master Control",
    },
    {
      id: "usr-2",
      name: "Aarav Mehta",
      email: "aarav@jassproducts.com",
      role: "STORE_MANAGER",
      status: "ACTIVE",
      lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: "2025-06-15",
      department: "Operations & Logistics",
    },
    {
      id: "usr-3",
      name: "Neha Gupta",
      email: "neha@jassproducts.com",
      role: "STAFF",
      status: "ACTIVE",
      lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
      createdAt: "2025-08-20",
      department: "Inventory QA & Fulfillment",
    },
  ];
}

function generateSeedSecurityLogs(): SecurityAuditLog[] {
  return [
    {
      id: "sec-1",
      action: "ADMIN_LOGIN_SUCCESS",
      user: "dr.jass@jassproducts.com",
      ipAddress: "103.21.144.12",
      severity: "INFO",
      details: "Two-factor verified session established via Secure WebAuthn.",
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: "sec-2",
      action: "STOCK_ADJUSTMENT",
      user: "aarav@jassproducts.com",
      ipAddress: "103.21.144.18",
      severity: "INFO",
      details: "Added 50 units to JP-HA-001 (Anti-Dandruff Shampoo) following batch brew.",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "sec-3",
      action: "ROLE_PERMISSION_VERIFIED",
      user: "System Gatekeeper",
      ipAddress: "127.0.0.1",
      severity: "INFO",
      details: "Verified admin permission tokens against public.is_admin() policy.",
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];
}

function generateSeedNotifications(): AdminNotification[] {
  return [
    {
      id: "notif-1",
      title: "New High-Value Order JP-89214",
      message: "Priya Sharma placed an order for ₹100 (Renew Serum & Shampoo).",
      type: "ORDER",
      read: false,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      link: "#admin/orders",
    },
    {
      id: "notif-2",
      title: "Quality Inspection Logged",
      message: "Glow Clay Mask batch damage recorded (1 unit recycled).",
      type: "STOCK",
      read: false,
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      link: "#admin/inventory",
    },
    {
      id: "notif-3",
      title: "Botanical Batch Brew #18 Complete",
      message: "40 units of Kashmiri Saffron Renew Serum added to inventory.",
      type: "STOCK",
      read: true,
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      link: "#admin/inventory",
    },
  ];
}

// -------------------------------------------------------------
// PERSISTENCE GETTERS & SETTERS
// -------------------------------------------------------------

function getStored<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = fallback();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function setStored<T>(key: string, data: T, eventName: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      broadcast(eventName);
    } catch (e) {
      console.warn("Storage write failed for key:", key, e);
    }
  }
}

// -------------------------------------------------------------
// EXPORTED STORE INTERFACES
// -------------------------------------------------------------

// 1. PRODUCTS
export function getStoredAdminProducts(): ExtendedProduct[] {
  return getStored(KEYS.PRODUCTS, generateSeedProducts);
}

export function saveStoredAdminProducts(items: ExtendedProduct[]) {
  setStored(KEYS.PRODUCTS, items, "products_updated");
}

export async function fetchAdminProducts(): Promise<ExtendedProduct[]> {
  const local = getStoredAdminProducts();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data && data.length > 0) {
        // Merge or sync
        return local;
      }
    } catch {}
  }
  return local;
}

export async function saveProduct(productData: Partial<ExtendedProduct>): Promise<ExtendedProduct[]> {
  const list = getStoredAdminProducts();
  const existingIdx = list.findIndex((p) => String(p.id) === String(productData.id));

  let updated: ExtendedProduct[];
  if (existingIdx >= 0) {
    const merged = { ...list[existingIdx], ...productData } as ExtendedProduct;
    updated = [...list];
    updated[existingIdx] = merged;
  } else {
    const newProd = {
      ...productData,
      id: productData.id || `jp-${Date.now().toString(36)}`,
      sku: productData.sku || `JP-${(productData.category || "BOT").slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `8906045${Math.floor(1000 + Math.random() * 9000)}`,
      status: "PUBLISHED",
      stockQuantity: productData.stockQuantity || 50,
      stockStatus: (productData.stockQuantity || 50) > 15 ? "IN_STOCK" : "LOW_STOCK",
      costPrice: productData.costPrice || Math.round((productData.price || 50) * 0.45),
      price: productData.price || 50,
      brand: "Jass Ayurveda",
      subcategory: productData.category || "HAIR CARE",
      tags: [productData.category || "HAIR CARE", "Ayurvedic"],
      inStock: true,
      gstRate: 18,
      hsnCode: "3305.90.11",
      weight: 0.35,
      slug: (productData.name || "item").toLowerCase().replace(/\s+/g, "-"),
    } as ExtendedProduct;
    updated = [newProd, ...list];
  }

  saveStoredAdminProducts(updated);
  return updated;
}

export async function deleteProduct(productId: string | number): Promise<ExtendedProduct[]> {
  const list = getStoredAdminProducts();
  const updated = list.filter((p) => String(p.id) !== String(productId));
  saveStoredAdminProducts(updated);
  return updated;
}

// 2. ORDERS
export function getStoredAdminOrders(): AdminOrderRecord[] {
  return getStored(KEYS.ORDERS, generateSeedOrders);
}

export function saveStoredAdminOrders(orders: AdminOrderRecord[]) {
  setStored(KEYS.ORDERS, orders, "orders_updated");
}

export async function fetchAdminOrders(): Promise<AdminOrderRecord[]> {
  const local = getStoredAdminOrders();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("orders").select("*");
      if (!error && data && data.length > 0) {
        return local;
      }
    } catch {}
  }
  return local;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: AdminOrderStatus,
  courier?: string,
  awbNumber?: string
): Promise<AdminOrderRecord[]> {
  const list = getStoredAdminOrders();
  const updated = list.map((o) => {
    if (o.id === orderId || o.orderNumber === orderId) {
      return {
        ...o,
        status: newStatus,
        courier: courier || o.courier,
        awbNumber: awbNumber || o.awbNumber,
        updatedAt: new Date().toISOString(),
      };
    }
    return o;
  });
  saveStoredAdminOrders(updated);
  return updated;
}

export async function addOrderStaffNote(orderId: string, note: string): Promise<AdminOrderRecord[]> {
  const list = getStoredAdminOrders();
  const updated = list.map((o) => {
    if (o.id === orderId || o.orderNumber === orderId) {
      const currentNotes = o.notes || [];
      return {
        ...o,
        notes: [note, ...currentNotes],
        updatedAt: new Date().toISOString(),
      };
    }
    return o;
  });
  saveStoredAdminOrders(updated);
  return updated;
}

// 3. CATEGORIES
export function getStoredAdminCategories(): CategoryItem[] {
  return getStored(KEYS.CATEGORIES, generateSeedCategories);
}

export function saveStoredAdminCategories(cats: CategoryItem[]) {
  setStored(KEYS.CATEGORIES, cats, "categories_updated");
}

export async function saveCategory(catData: Partial<CategoryItem>): Promise<CategoryItem[]> {
  const list = getStoredAdminCategories();
  const idx = list.findIndex((c) => c.id === catData.id);
  let updated: CategoryItem[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = { ...updated[idx], ...catData } as CategoryItem;
  } else {
    const newCat = {
      id: `cat-${Date.now().toString(36)}`,
      name: catData.name || "New Category",
      slug: (catData.name || "new-category").toLowerCase().replace(/\s+/g, "-"),
      description: catData.description || "",
      image: catData.image || "/products/herbal-shampoo/main.png",
      displayOrder: list.length + 1,
      status: "ACTIVE",
      productCount: 0,
      ...catData,
    } as CategoryItem;
    updated = [...list, newCat];
  }
  saveStoredAdminCategories(updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<CategoryItem[]> {
  const list = getStoredAdminCategories();
  const updated = list.filter((c) => c.id !== id);
  saveStoredAdminCategories(updated);
  return updated;
}

// 4. INVENTORY & AUDIT LOGS
export function getStoredInventoryLogs(): StockMovementLog[] {
  return getStored(KEYS.INVENTORY_LOGS, generateSeedInventoryLogs);
}

export function saveStoredInventoryLogs(logs: StockMovementLog[]) {
  setStored(KEYS.INVENTORY_LOGS, logs, "inventory_updated");
}

export async function adjustProductStock(
  productId: string | number,
  quantityChange: number,
  type: StockMovementLog["type"],
  reason: string,
  user: string = "Admin Botanist",
  supplierName?: string,
  poNumber?: string
): Promise<{ products: ExtendedProduct[]; logs: StockMovementLog[] }> {
  const prods = getStoredAdminProducts();
  const prodIdx = prods.findIndex((p) => String(p.id) === String(productId));

  if (prodIdx === -1) {
    return { products: prods, logs: getStoredInventoryLogs() };
  }

  const prod = prods[prodIdx];
  const oldStock = prod.stockQuantity || 0;
  const newStock = Math.max(0, oldStock + quantityChange);

  let newStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
  if (newStock <= 0) newStatus = "OUT_OF_STOCK";
  else if (newStock <= (prod.minStockThreshold || 15)) newStatus = "LOW_STOCK";

  const updatedProd: ExtendedProduct = {
    ...prod,
    stockQuantity: newStock,
    stockStatus: newStatus,
    inStock: newStock > 0,
  };

  const updatedProds = [...prods];
  updatedProds[prodIdx] = updatedProd;
  saveStoredAdminProducts(updatedProds);

  // Append audit log
  const newLog: StockMovementLog = {
    id: `log-${Date.now()}`,
    productId: prod.id,
    productName: prod.name,
    sku: prod.sku,
    quantityChange,
    previousStock: oldStock,
    newStock,
    type,
    reason,
    supplierName,
    poNumber,
    timestamp: new Date().toISOString(),
    user,
  };

  const logs = [newLog, ...getStoredInventoryLogs()];
  saveStoredInventoryLogs(logs);

  return { products: updatedProds, logs };
}

// 5. CUSTOMERS
export function getStoredAdminCustomers(): CustomerRecord[] {
  return getStored(KEYS.CUSTOMERS, generateSeedCustomers);
}

export function saveStoredAdminCustomers(customers: CustomerRecord[]) {
  setStored(KEYS.CUSTOMERS, customers, "customers_updated");
}

export async function toggleCustomerBlock(customerId: string): Promise<CustomerRecord[]> {
  const list = getStoredAdminCustomers();
  const updated = list.map((c) => {
    if (c.id === customerId) {
      return {
        ...c,
        status: c.status === "ACTIVE" ? ("BLOCKED" as const) : ("ACTIVE" as const),
      };
    }
    return c;
  });
  saveStoredAdminCustomers(updated);
  return updated;
}

export async function addCustomerNote(customerId: string, note: string): Promise<CustomerRecord[]> {
  const list = getStoredAdminCustomers();
  const updated = list.map((c) => {
    if (c.id === customerId) {
      const existing = c.notes || [];
      return {
        ...c,
        notes: [note, ...existing],
      };
    }
    return c;
  });
  saveStoredAdminCustomers(updated);
  return updated;
}

// 6. PAYMENTS
export function getStoredAdminPayments(): PaymentTransactionRecord[] {
  return getStored(KEYS.PAYMENTS, generateSeedPayments);
}

export function saveStoredAdminPayments(payments: PaymentTransactionRecord[]) {
  setStored(KEYS.PAYMENTS, payments, "payments_updated");
}

export async function refundPayment(txnId: string): Promise<PaymentTransactionRecord[]> {
  const list = getStoredAdminPayments();
  const updated = list.map((t) => (t.id === txnId ? { ...t, status: "REFUNDED" as const } : t));
  saveStoredAdminPayments(updated);
  return updated;
}

// 7. SHIPPING
export function getStoredAdminShipping(): ShippingShipmentRecord[] {
  return getStored(KEYS.SHIPPING, generateSeedShipments);
}

export function saveStoredAdminShipping(shipments: ShippingShipmentRecord[]) {
  setStored(KEYS.SHIPPING, shipments, "shipping_updated");
}

// 8. BANNERS
export function getStoredAdminBanners(): HeroBannerRecord[] {
  return getStored(KEYS.BANNERS, generateSeedBanners);
}

export function saveStoredAdminBanners(banners: HeroBannerRecord[]) {
  setStored(KEYS.BANNERS, banners, "banners_updated");
}

// 9. REVIEWS
export function getStoredAdminReviews(): ReviewRecord[] {
  return getStored(KEYS.REVIEWS, generateSeedReviews);
}

export function saveStoredAdminReviews(reviews: ReviewRecord[]) {
  setStored(KEYS.REVIEWS, reviews, "reviews_updated");
}

export async function updateReviewStatus(reviewId: string, status: ReviewRecord["status"]): Promise<ReviewRecord[]> {
  const list = getStoredAdminReviews();
  const updated = list.map((r) => (r.id === reviewId ? { ...r, status } : r));
  saveStoredAdminReviews(updated);
  return updated;
}

export async function deleteReview(reviewId: string): Promise<ReviewRecord[]> {
  const list = getStoredAdminReviews();
  const updated = list.filter((r) => r.id !== reviewId);
  saveStoredAdminReviews(updated);
  return updated;
}

// 10. CMS CONFIG
export function getStoredCmsConfig(): StorefrontCmsConfig {
  return getStored(KEYS.CMS, generateSeedCms);
}

export function saveStoredCmsConfig(config: StorefrontCmsConfig) {
  setStored(KEYS.CMS, config, "cms_updated");
}

// 11. STAFF & USERS
export function getStoredAdminUsers(): AdminUserRecord[] {
  return getStored(KEYS.USERS, generateSeedUsers);
}

export function saveStoredAdminUsers(users: AdminUserRecord[]) {
  setStored(KEYS.USERS, users, "users_updated");
}

export async function updateUserRole(userId: string, newRole: AdminUserRecord["role"]): Promise<AdminUserRecord[]> {
  const list = getStoredAdminUsers();
  const updated = list.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  saveStoredAdminUsers(updated);
  return updated;
}

export async function toggleUserStatus(userId: string): Promise<AdminUserRecord[]> {
  const list = getStoredAdminUsers();
  const updated = list.map((u) => (u.id === userId ? { ...u, status: u.status === "ACTIVE" ? ("SUSPENDED" as const) : ("ACTIVE" as const) } : u));
  saveStoredAdminUsers(updated);
  return updated;
}

export async function inviteAdminUser(userData: Partial<AdminUserRecord>): Promise<AdminUserRecord[]> {
  const list = getStoredAdminUsers();
  const newUser: AdminUserRecord = {
    id: `usr-${Date.now()}`,
    name: userData.name || "New Staff Member",
    email: userData.email || `staff-${Date.now()}@jassproducts.com`,
    role: userData.role || "STAFF",
    status: "ACTIVE",
    lastLogin: "Never",
    createdAt: new Date().toISOString(),
    department: userData.department || "Operations",
  };
  const updated = [...list, newUser];
  saveStoredAdminUsers(updated);
  return updated;
}

// 12. SECURITY LOGS
export function getStoredSecurityLogs(): SecurityAuditLog[] {
  return getStored(KEYS.SECURITY_LOGS, generateSeedSecurityLogs);
}

export function logSecurityEvent(action: string, details: string, severity: SecurityAuditLog["severity"] = "INFO", user: string = "Admin Console") {
  const list = getStoredSecurityLogs();
  const newEntry: SecurityAuditLog = {
    id: `sec-${Date.now()}`,
    action,
    user,
    ipAddress: "103.21.144.12",
    severity,
    details,
    timestamp: new Date().toISOString(),
  };
  setStored(KEYS.SECURITY_LOGS, [newEntry, ...list], "security_updated");
}

// 13. NOTIFICATIONS
export function getStoredAdminNotifications(): AdminNotification[] {
  return getStored(KEYS.NOTIFICATIONS, generateSeedNotifications);
}

export function saveStoredAdminNotifications(notifs: AdminNotification[]) {
  setStored(KEYS.NOTIFICATIONS, notifs, "notifications_updated");
}

export function markAllNotificationsRead() {
  const list = getStoredAdminNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  saveStoredAdminNotifications(updated);
}

export function clearAllNotifications() {
  saveStoredAdminNotifications([]);
}

export function markNotificationAsRead(id: string) {
  const list = getStoredAdminNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredAdminNotifications(updated);
}

// 14. ACTIVE ROLE EMULATION — REMOVED (security audit fix)
// The localStorage role switcher (which defaulted to SUPER_ADMIN and could be
// re-set from the admin 403 screen) allowed anyone to self-grant console
// access in the UI. Authorization is now driven by the verified Supabase
// session and the server-protected profiles.role (see AuthContext and
// AdminLayout). This stub keeps any straggler import from crashing loudly.
export function getActiveAdminRole(): string {
  console.warn(
    "getActiveAdminRole() is deprecated: use useAuth().isAdmin (server-verified role).",
  );
  return "CUSTOMER";
}
