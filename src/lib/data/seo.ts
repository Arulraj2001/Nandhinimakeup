import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { Database } from "@/types/database";

export type SeoPageRecord = Database["public"]["Tables"]["seo_pages"]["Row"];

export interface StaticPageSeoData extends SeoPageRecord {
  media?: {
    id: string;
    storage_path: string;
    alt_text: string;
    width: number;
    height: number;
  } | null;
}

/**
 * Returns SEO settings for a static page by path.
 * Cached with 'seo' tag.
 */
export async function getStaticPageSeo(
  path: string
): Promise<StaticPageSeoData | null> {
  "use cache";
  cacheTag(CACHE_TAGS.seo);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("seo_pages")
    .select("*, media:og_image_id(*)")
    .eq("path", path)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    media: data.media as StaticPageSeoData["media"],
  };
}

/**
 * Returns all static SEO pages for admin management.
 * Cached with 'seo' tag.
 */
export async function getAllStaticSeoPages(): Promise<StaticPageSeoData[]> {
  "use cache";
  cacheTag(CACHE_TAGS.seo);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("seo_pages")
    .select("*, media:og_image_id(*)")
    .order("path", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data || []).map((row) => ({
    ...row,
    media: row.media as StaticPageSeoData["media"],
  }));
}
