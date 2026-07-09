import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

export function isAuthConfigured() {
  return isSupabaseConfigured();
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  return data.session;
}

export function subscribeToAuthChanges(onChange: (session: Session | null) => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return { unsubscribe() {} };

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });

  return data.subscription;
}

export async function signInToPortal(email: string, password: string): Promise<Session> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.session) throw new Error("Sign in did not return a session.");

  return data.session;
}

export async function signOutOfPortal() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
