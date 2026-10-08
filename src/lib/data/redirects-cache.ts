import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface CachedRedirect {
  to_path: string;
  status_code: number;
}

let redirectMap: Map<string, CachedRedirect> | null = null;
let cacheExpiresAt = 0;

/**
 * Clears the in-process redirects cache.
 * Called when an admin creates, updates, or deletes a redirect.
 */
export function clearRedirectCache(): void {
  redirectMap = null;
  cacheExpiresAt = 0;
}

/**
 * Loads and retrieves a redirect from an in-process cache map with a 60-second TTL.
 * Caches an empty table too, fails open if database errors.
 */
export async function getCachedRedirect(
  pathname: string,
  supabase: SupabaseClient<Database>
): Promise<CachedRedirect | null> {
  const now = Date.now();
  if (!redirectMap || now > cacheExpiresAt) {
    try {
      const { data, error } = await supabase
        .from("redirects")
        .select("from_path, to_path, status_code");

      const map = new Map<string, CachedRedirect>();
      if (!error && Array.isArray(data)) {
        for (const r of data) {
          map.set(r.from_path, {
            to_path: r.to_path,
            status_code: r.status_code,
          });
        }
      }
      redirectMap = map;
      cacheExpiresAt = now + 60_000;
    } catch {
      // Fail open if database errors
      return null;
    }
  }

  return redirectMap.get(pathname) ?? null;
}
