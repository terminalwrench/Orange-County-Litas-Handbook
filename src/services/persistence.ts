import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

const warningKeys = new Set<string>();

export interface PersistenceResult<T> {
  data: T;
  source: "supabase" | "fallback";
}

export function getPersistenceStatus() {
  return {
    isConfigured: isSupabaseConfigured()
  };
}

export function getPersistenceClient() {
  const client = getSupabaseClient();

  if (!client) {
    warnOnce(
      "supabase-unconfigured",
      "[persistence] Supabase env vars are not configured. Using static fallback data."
    );
  }

  return client;
}

export function warnAndUseFallback(message: string, error: unknown) {
  warnOnce(message, `[persistence] ${message}`, error);
}

function warnOnce(key: string, message: string, error?: unknown) {
  if (warningKeys.has(key)) return;
  warningKeys.add(key);

  if (error === undefined) {
    console.warn(message);
    return;
  }

  console.warn(message, error);
}
