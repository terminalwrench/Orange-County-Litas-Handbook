import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

export interface PersistenceResult<T> {
  data: T;
  source: "supabase" | "fallback";
}

export interface PersistenceListResult<T> {
  data: T[];
  source: "supabase" | "fallback";
}

export function getPersistenceStatus() {
  return {
    isConfigured: isSupabaseConfigured()
  };
}

export function getPersistenceClient() {
  return getSupabaseClient();
}

export function warnAndUseFallback(message: string, error: unknown) {
  console.warn(`[persistence] ${message}`, error);
}
