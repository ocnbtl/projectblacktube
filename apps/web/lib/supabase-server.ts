import { createClient } from "@supabase/supabase-js";

import { requireSupabaseServerEnv } from "./env";

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseSecretKey } = requireSupabaseServerEnv();

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
