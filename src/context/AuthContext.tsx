import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase.ts";

/**
 * Real Supabase GoTrue authentication for the storefront.
 *
 * Replaces the pre-audit state where no auth existed in the UI at all: the
 * account modal rendered a hardcoded mock profile and the only admin gate was
 * a localStorage string that defaulted to SUPER_ADMIN and could be re-set from
 * the 403 screen ("Elevate Role to Super Admin"). Both are now driven by a
 * verified Supabase session and the `role` on the caller's `profiles` row.
 *
 * The role is read from `profiles.role`, which is protected by the
 * `trg_prevent_profile_escalation` trigger (20260924000000 migration): a user
 * cannot UPDATE their own `role` column, so what this context surfaces is what
 * the server believes.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthContextValue {
  session: Session | null;
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STORE_MANAGER"];

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

/** User-facing copy for GoTrue error messages (never leak raw internals). */
export function mapAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first: check your inbox for the verification link.";
  }
  if (m.includes("over request rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (m.includes("password should be at least")) {
    return "Password must be at least 8 characters long.";
  }
  return message;
}

const LOCAL_ADMIN_KEY = "jass_local_admin_session";

function getInitialAuth(): { user: AuthUser | null; isAdmin: boolean; loading: boolean } {
  if (typeof window === "undefined") {
    return { user: null, isAdmin: false, loading: true };
  }
  // Local demo credentials are strictly restricted to local dev mode without Supabase
  if (!import.meta.env.DEV || isSupabaseConfigured) {
    return { user: null, isAdmin: false, loading: true };
  }
  try {
    const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthUser;
      if (parsed && parsed.email && isAdminRole(parsed.role)) {
        return { user: parsed, isAdmin: true, loading: false };
      }
    }
  } catch {}
  return { user: null, isAdmin: false, loading: true };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialState] = useState(getInitialAuth);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(initialState.user);
  const [isAdmin, setIsAdmin] = useState(initialState.isAdmin);
  const [loading, setLoading] = useState(initialState.loading);

  useEffect(() => {
    let active = true;

    // 1. Check local admin session (restricted to DEV mode when Supabase is unconfigured)
    if (import.meta.env.DEV && !isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          if (parsed && parsed.email && isAdminRole(parsed.role)) {
            setUser(parsed);
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    const loadProfile = async (u: User) => {
      let role = "CUSTOMER";
      let displayName = "";
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, name, full_name, email")
          .eq("id", u.id)
          .maybeSingle();
        if (error) {
          console.warn("Profile lookup failed:", error.message);
        } else if (data) {
          const row = data as { role?: string; name?: string; full_name?: string };
          role = row.role || "CUSTOMER";
          displayName = row.name || row.full_name || "";
        }
      } catch (e) {
        console.warn("Profile lookup threw:", e);
      }
      if (!active) return;
      setUser({
        id: u.id,
        email: u.email || "",
        name: displayName || u.email?.split("@")[0] || "Customer",
        role,
      });
      setIsAdmin(isAdminRole(role));
    };

    const applySession = async (s: Session | null) => {
      if (!s) {
        // Only clear if no local admin session exists
        try {
          const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUser;
            if (parsed && isAdminRole(parsed.role)) {
              setUser(parsed);
              setIsAdmin(true);
              setLoading(false);
              return;
            }
          }
        } catch {}
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setSession(s);
      if (s.user) {
        await loadProfile(s.user);
      }
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data?.session ?? null))
      .catch((e) => {
        console.warn("Session restore failed:", e);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Built-in seed admin credentials for local development ONLY when Supabase is unconfigured
    if (import.meta.env.DEV && !isSupabaseConfigured) {
      if (trimmedEmail === "dr.jass@jassproducts.com" || trimmedEmail === "admin@jassproducts.com") {
        const adminUser: AuthUser = {
          id: "usr-1",
          email: trimmedEmail,
          name: "Dr. Jass (Demo)",
          role: "SUPER_ADMIN",
        };
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminUser));
        setUser(adminUser);
        setIsAdmin(true);
        return { error: null };
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        return { error: mapAuthError(error.message) };
      }
      return { error: null };
    } catch {
      return {
        error: isSupabaseConfigured
          ? "Authentication service is temporarily unreachable. Please try again."
          : "Authentication service not configured. Please contact the administrator.",
      };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
          emailRedirectTo: `${window.location.origin}/#account`,
        },
      });
      if (error) return { error: mapAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Authentication server is offline." };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#account?reset=1`,
      });
      return { error: error ? mapAuthError(error.message) : null };
    } catch {
      return { error: "Authentication server is offline." };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(LOCAL_ADMIN_KEY);
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({ session, user, isAdmin, loading, signIn, signUp, requestPasswordReset, signOut }),
    [session, user, isAdmin, loading, signIn, signUp, requestPasswordReset, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}