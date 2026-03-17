function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const env = {
  appUrl: normalizeEnvValue(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  supportEmail: normalizeEnvValue(process.env.ZOHO_SUPPORT_EMAIL) ?? "hello@purrifymusic.com",
  supabaseUrl: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  supabaseSecretKey: normalizeEnvValue(process.env.SUPABASE_SECRET_KEY),
  supabaseProjectId: normalizeEnvValue(process.env.SUPABASE_PROJECT_ID),
  extensionSharedSecret: normalizeEnvValue(process.env.EXTENSION_SHARED_SECRET)
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
