import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { RedirectRow } from "@/types/redirects";

/**
 * Normalizes a URL path: ensures leading slash, removes trailing slash (except root).
 */
export function normalizeRedirectPath(path: string): string {
  if (!path) return "/";
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.replace(/\/+$/, "");
  }
  return withSlash;
}

/**
 * Looks up a redirect for a path in the database.
 * Cached under Cache Components with the 'redirects' tag.
 */
export async function getRedirectForPath(
  path: string
): Promise<RedirectRow | null> {
  "use cache";
  cacheTag(CACHE_TAGS.redirects);

  const supabase = getStatelessClient();
  const cleanPath = normalizeRedirectPath(path);

  const { data, error } = await supabase
    .from("redirects")
    .select("*")
    .eq("from_path", cleanPath)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
