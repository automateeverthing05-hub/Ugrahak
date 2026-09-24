import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Ensure this module is only ever executed on the server
if (typeof window !== "undefined") {
  throw new Error("Supabase Admin Client must only be used on the server side.");
}

let cachedAdminClient: ReturnType<typeof createSupabaseAdminClient<Database>> | null = null;

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables."
    );
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseAdminClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedAdminClient;
}
