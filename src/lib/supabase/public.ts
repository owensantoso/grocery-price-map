import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

let publicClient: SupabaseClient<Database> | null = null;

export function createSupabasePublicClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!publicClient) {
    publicClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return publicClient;
}
