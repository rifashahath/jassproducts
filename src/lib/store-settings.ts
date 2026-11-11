import { useState, useEffect } from 'react';
import { apiUrl } from './api-endpoints';

export interface StoreSettingsData {
  storeName: string;
  currency: string;
  gstin: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
}

export interface StoreCmsData {
  announcementBarText: string;
  announcementBarActive: boolean;
  heroHeadline: string;
  heroSubheadline: string;
  footerTagline: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingAbove: number;
}

export const DEFAULT_SETTINGS: StoreSettingsData = {
  storeName: "JASS PRODUCTS",
  currency: "INR (₹)",
  gstin: "29AABCJ1984K1Z4",
  supportEmail: "apothecary@jassproducts.com",
  supportPhone: "070922 03886",
  address: "Dispensary 1: Near Noor Sait Primary School, Karumbukkadai | Dispensary 2: 13B Bright Avenue, Kuniyamuthur, Coimbatore, Tamil Nadu 641008",
};

export const DEFAULT_CMS: StoreCmsData = {
  announcementBarText: "Complimentary Pure Cold-Pressed Hair Oil Sample with Orders Above ₹999 | Free Express Shipping Pan-India",
  announcementBarActive: true,
  heroHeadline: "Ancient Ayurveda for Modern Living",
  heroSubheadline: "Clinically potent, preservative-free botanical formulations crafted in small batches.",
  footerTagline: "Crafted in Coimbatore, Tamil Nadu for Indian hair and scalp resilience against borewell hard water.",
  contactEmail: "apothecary@jassproducts.com",
  contactPhone: "070922 03886",
  freeShippingAbove: 5000,
};

const SETTINGS_KEY = "jass_store_settings_v1";
const CMS_KEY = "jass_admin_cms_v1";

export function getCachedSettings(): StoreSettingsData {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function getCachedCms(): StoreCmsData {
  if (typeof window === 'undefined') return DEFAULT_CMS;
  try {
    const raw = localStorage.getItem(CMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CMS, ...parsed };
    }
  } catch {}
  return DEFAULT_CMS;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettingsData>(getCachedSettings);
  const [cms, setCms] = useState<StoreCmsData>(getCachedCms);

  useEffect(() => {
    const update = () => {
      setSettings(getCachedSettings());
      setCms(getCachedCms());
    };

    window.addEventListener('settings_updated', update);
    window.addEventListener('cms_updated', update);
    window.addEventListener('storage', update);

    // Fetch live from server
    fetch(apiUrl('admin-settings'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.storeName || data.supportPhone || data.supportEmail) {
            const newSettings = { ...DEFAULT_SETTINGS, ...data };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
          }
          if (data.cms_config) {
            const newCms = { ...DEFAULT_CMS, ...data.cms_config };
            localStorage.setItem(CMS_KEY, JSON.stringify(newCms));
            setCms(newCms);
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('settings_updated', update);
      window.removeEventListener('cms_updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return { settings, cms };
}
