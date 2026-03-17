function readEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const env = {
  appUrl: readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  supportEmail: readEnv("ZOHO_SUPPORT_EMAIL") ?? "hello@purrifymusic.com",
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: readEnv("SUPABASE_SECRET_KEY"),
  supabaseProjectId: readEnv("SUPABASE_PROJECT_ID"),
  extensionSharedSecret: readEnv("EXTENSION_SHARED_SECRET")
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function requireSupabaseBrowserEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      "Supabase browser env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabasePublishableKey: env.supabasePublishableKey
  };
}

export function requireSupabaseServerEnv() {
  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error("Supabase server env is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseSecretKey: env.supabaseSecretKey
  };
}
