import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";
import type { Database } from "@/types/database";

let statelessClient: ReturnType<typeof createSupabaseClient<Database>> | null =
  null;

/**
 * Returns a stateless Supabase client created with the anon key and no cookies.
 * Does not read cookies, headers, or sessions, ensuring public pages remain prerenderable and cacheable.
 */
export function getStatelessClient() {
  if (!statelessClient) {
    statelessClient = createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return statelessClient;
}
