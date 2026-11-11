import React, { useState, useEffect } from "react";
import { Settings, Save, Check, ShieldCheck, Mail, MapPin, Building2, Loader2 } from "lucide-react";

const SETTINGS_STORAGE_KEY = "jass_store_settings_v1";

export const SettingsView: React.FC = () => {
  const [storeName, setStoreName] = useState("JASS PRODUCTS");
  const [currency, setCurrency] = useState("INR (₹)");
  const [gstin, setGstin] = useState("29AABCJ1984K1Z4");
  const [supportEmail, setSupportEmail] = useState("apothecary@jassproducts.com");
  const [supportPhone, setSupportPhone] = useState("070922 03886 / 97151 63119");
  const [address, setAddress] = useState("Dispensary 1: Near Noor Sait Primary School, Karumbukkadai | Dispensary 2: 13B Bright Avenue, Kuniyamuthur, Coimbatore, Tamil Nadu 641008");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved settings from server and localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.gstin) setGstin(parsed.gstin);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.supportPhone) setSupportPhone(parsed.supportPhone);
        if (parsed.address) setAddress(parsed.address);
      }
    } catch {}

    fetch("/api/admin-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
          if (data.currency) setCurrency(data.currency);
          if (data.gstin) setGstin(data.gstin);
          if (data.supportEmail) setSupportEmail(data.supportEmail);
          if (data.supportPhone) setSupportPhone(data.supportPhone);
          if (data.address) setAddress(data.address);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      storeName,
      currency,
      gstin,
      supportEmail,
      supportPhone,
      address,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event("settings_updated"));
      window.dispatchEvent(new Event("storage"));
      await fetch("/api/admin-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("Failed to sync settings with server, saved locally:", err);
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2A26]">
            Store & Dispensary Configuration
          </h1>
          <p className="text-xs text-[#2D2A26]/70 mt-1">
            Global settings for tax compliance, currency, dispensary location, and customer support.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>Settings saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Dispensary Identity */}
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8E1D5] pb-3">
            <Building2 className="h-4 w-4 text-[#8B6D43]" />
            <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
              Business & Brand Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Storefront Currency
              </label>
              <input
                type="text"
                value={currency}
                disabled
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6]/50 border border-[#D2C2AD]/50 rounded-xl text-xs font-mono text-[#2D2A26]/70 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              GSTIN Registration Number (India)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Dispensary & Distillery Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
            />
          </div>
        </div>

        {/* Customer Support Channels */}
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8E1D5] pb-3">
            <Mail className="h-4 w-4 text-[#8B6D43]" />
            <h3 className="font-serif text-sm font-bold text-[#2D2A26]">
              Customer Care & Communications
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Phone Helpline
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D2C2AD]/80 rounded-xl text-xs text-[#2D2A26] focus:outline-none focus:border-[#8B6D43]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B6D43] hover:bg-[#735732] disabled:opacity-60 text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{saving ? "Saving Configuration..." : "Save Store Configuration"}</span>
        </button>
      </form>
    </div>
  );
};
