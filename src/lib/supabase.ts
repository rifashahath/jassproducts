/**
 * Supabase Client Configuration & Singleton Instance.
 * Configured for Jass Products E-Commerce.
 * Isomorphic: works across Vite browser runtime, Node.js scripts, and SSR/Serverless.
 */

import { createClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key] as string;
    }
  } catch {}
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {}
  return "";
}

export const SUPABASE_URL = getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL");
export const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("duxjhmhgiacmuuqzfjxs") &&
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
