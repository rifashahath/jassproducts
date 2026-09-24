import React, { useState, type ReactNode } from "react";
import { ShieldAlert, ArrowLeft, LogIn, Lock, Sparkles, Loader2 } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar.tsx";
import { AdminHeader } from "./AdminHeader.tsx";
import { GlobalSearchDialog } from "../common/GlobalSearchDialog.tsx";
import { NotificationsDrawer } from "../common/NotificationsDrawer.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { isSupabaseConfigured } from "../../../lib/supabase.ts";

interface AdminLayoutProps {
  currentSubpath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
  onQuickAddProduct?: () => void;
  onQuickStockAdjust?: () => void;
}

/**
 * Admin console gate.
 *
 * Pre-audit, authorization here was `isAdminRole(localStorage['jass_admin_active_role_v1'] || 'SUPER_ADMIN')`
 * — a self-grantable client-side check whose 403 screen even shipped an
 * "Elevate Role to Super Admin" button. That emulation is gone.
 *
 * Access now requires BOTH:
 *   1. a verified Supabase session (auth.getSession / onAuthStateChange), and
 *   2. the session user's `profiles.role` being an admin role.
 *
 * The role comes from the server (protected by the
 * trg_prevent_profile_escalation trigger), so no local value can grant access.
 * This is still a UX gate — the authoritative data wall is RLS on the tables
 * the console reads (`orders`, `products`, `profiles`), which admit admin rows
 * only when public.is_admin() is true for the caller's session.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSubpath,
  onNavigate,
  children,
  onQuickAddProduct,
  onQuickStockAdjust,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { user, isAdmin, loading } = useAuth();

  // While the session is being restored, render nothing admin-shaped so no
  // console content flashes before authentication resolves.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-[#8B6D43] font-semibold animate-pulse">
          Verifying credentials…
        </div>
      </div>
    );
  }

function AdminSignInCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("dr.jass@jassproducts.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleQuickDemoAccess = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await signIn("dr.jass@jassproducts.com", "admin");
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2A26] flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full border border-[#D2C2AD] bg-[#FAF8F5] p-8 sm:p-10 rounded-[2rem] shadow-xl text-left">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8B6D43]/15 text-[#8B6D43] mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#8B6D43] uppercase font-semibold">
            Staff & Dispensary Access
          </span>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl text-[#2D2A26] font-bold">
            Apothecary Console
          </h1>
          <p className="mt-2 text-xs text-[#2D2A26]/70 leading-relaxed">
            Enter administrative credentials to open the management portal.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.jass@jassproducts.com"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm text-[#2D2A26]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm text-[#2D2A26]"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-[#8B6D43] hover:bg-[#735732] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            <span>Sign In to Console</span>
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[#D2C2AD]/50 flex flex-col gap-3">
          {import.meta.env.DEV && !isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              disabled={busy}
              className="w-full py-2.5 px-4 bg-[#8B6D43]/10 hover:bg-[#8B6D43]/20 text-[#8B6D43] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>[DEV ONLY] Quick Sign-In as Dr. Jass</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate("#home")}
            className="inline-flex items-center justify-center gap-1.5 text-xs text-[#2D2A26]/60 hover:text-[#8B6D43] transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
}

  // No session at all → render inline admin sign-in form
  if (!user) {
    return <AdminSignInCard onNavigate={onNavigate} />;
  }

  // Authenticated but not an admin (per the server-side profile role).
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#2D2A26] flex items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full border border-[#D2C2AD] bg-[#FAF8F5] p-8 sm:p-10 rounded-[2rem] shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <span className="text-[11px] font-mono tracking-widest text-red-600 uppercase font-semibold">
            403 Forbidden
          </span>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl text-[#2D2A26] font-bold">
            Apothecary Portal Restricted
          </h1>
          <p className="mt-3 text-xs text-[#2D2A26]/70 leading-relaxed">
            Your account does not carry administrative permissions. If you believe this is an error,
            contact a store administrator — there is no self-service elevation.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onNavigate("#home")}
              className="inline-flex items-center justify-center gap-2 text-xs text-[#2D2A26]/60 hover:text-[#8B6D43] transition-colors cursor-pointer py-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-[#F4EFE6] selection:text-[#8B6D43]">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentPath={`#admin/${currentSubpath}`}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onNavigate={onNavigate}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        {/* Sticky Header */}
        <AdminHeader
          currentSubpath={currentSubpath}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen(!mobileSidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onNavigate={onNavigate}
          onQuickAddProduct={onQuickAddProduct}
          onQuickStockAdjust={onQuickStockAdjust}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
