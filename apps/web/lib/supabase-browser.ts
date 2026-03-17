"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

import { env, requireSupabaseBrowserEnv } from "./env";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseBrowserEnv();

  browserClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return browserClient;
}

export async function signInWithGoogle() {
  const supabase = getBrowserSupabaseClient();
  const redirectTo =
    typeof window === "undefined" ? `${env.appUrl}/dashboard` : `${window.location.origin}/dashboard`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
}

export async function signOut() {
  return getBrowserSupabaseClient().auth.signOut();
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getBrowserSupabaseClient().auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}
