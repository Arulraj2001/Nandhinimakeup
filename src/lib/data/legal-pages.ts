import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { RichTextDoc } from "@/lib/utils/rich-text";

export interface PublishedLegalPage {
  slug: "privacy-policy" | "terms-and-conditions" | "shipping-and-returns";
  title: string;
  content: RichTextDoc;
  updated_at: string;
}

/**
 * Returns a single published legal page by slug.
 * Cached with 'legal' tag.
 */
export async function getPublishedLegalPage(
  slug: string
): Promise<PublishedLegalPage | null> {
  "use cache";
  cacheTag(CACHE_TAGS.legal);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("legal_pages")
    .select("slug, title, content, updated_at")
    .eq("slug", slug as "privacy-policy" | "terms-and-conditions" | "shipping-and-returns")
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    slug: data.slug,
    title: data.title,
    content: (data.content as unknown as RichTextDoc) || { type: "doc", content: [] },
    updated_at: data.updated_at,
  };
}

/**
 * Returns all published legal pages for navigation, footer, and checkout links.
 * Cached with 'legal' tag.
 */
export async function getPublishedLegalPages(): Promise<
  Array<{
    slug: "privacy-policy" | "terms-and-conditions" | "shipping-and-returns";
    title: string;
  }>
> {
  "use cache";
  cacheTag(CACHE_TAGS.legal);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("legal_pages")
    .select("slug, title")
    .eq("is_published", true);

  if (error || !data) {
    return [];
  }

  return data;
}
