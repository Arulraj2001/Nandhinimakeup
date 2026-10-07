import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { ServiceCategory } from "@/types/services";

/**
 * Returns all published service categories ordered by sort_order.
 * Cached with 'service-categories' tag.
 */
export async function getPublicServiceCategories(): Promise<ServiceCategory[]> {
  "use cache";
  cacheTag(CACHE_TAGS.serviceCategories);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getPublicServiceCategoryBySlug(
  slug: string
): Promise<ServiceCategory | null> {
  "use cache";
  cacheTag(CACHE_TAGS.serviceCategories);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
