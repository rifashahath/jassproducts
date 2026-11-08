/**
 * Supabase Client Configuration & Singleton Instance.
 * Configured for Jass Products E-Commerce.
 * Isomorphic: works across Vite browser runtime, Node.js scripts, and SSR/Serverless.
 */

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  "";

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("unconfigured")
);

const isBrowser = typeof window !== "undefined";

export const supabase = createClient(
  SUPABASE_URL || "https://unconfigured.supabase.co",
  SUPABASE_ANON_KEY || "unconfigured-key",
  {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storageKey: "jass_auth_token",
    },
  },
);
