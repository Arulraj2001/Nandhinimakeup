import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { ServiceWithCategory } from "@/types/services";

/**
 * Returns all published services with their category and media image.
 * Category must also be published.
 * Cached with 'services' tag.
 */
export async function getPublicServices(): Promise<ServiceWithCategory[]> {
  "use cache";
  cacheTag(CACHE_TAGS.services);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, category:category_id(*), image:image_id(*)")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Filter out any service whose category is not published
  return (data as unknown as ServiceWithCategory[]).filter(
    (s) => s.category && s.category.is_published
  );
}

/**
 * Returns single published service by its slug.
 */
export async function getPublicServiceBySlug(
  slug: string
): Promise<ServiceWithCategory | null> {
  "use cache";
  cacheTag(CACHE_TAGS.services);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, category:category_id(*), image:image_id(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const service = data as unknown as ServiceWithCategory;
  if (!service.category || !service.category.is_published) {
    return null;
  }

  return service;
}

/**
 * Returns up to 3 related published services from the same category.
 */
export async function getPublicRelatedServices(
  categoryId: string,
  excludeServiceId: string,
  limit = 3
): Promise<ServiceWithCategory[]> {
  "use cache";
  cacheTag(CACHE_TAGS.services);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, category:category_id(*), image:image_id(*)")
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .neq("id", excludeServiceId)
    .order("sort_order", { ascending: true })
    .limit(limit);

  let list = !error && data ? (data as unknown as ServiceWithCategory[]) : [];

  // If category has fewer than limit services, backfill with other published services
  if (list.length < limit) {
    const existingIds = [excludeServiceId, ...list.map((s) => s.id)];
    const needed = limit - list.length;
    const { data: fallback } = await supabase
      .from("services")
      .select("*, category:category_id(*), image:image_id(*)")
      .eq("is_published", true)
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(needed);

    if (fallback && fallback.length > 0) {
      list = [...list, ...(fallback as unknown as ServiceWithCategory[])];
    }
  }

  return list;
}

/**
 * Returns up to N featured published services for the Home page.
 */
export async function getPublicFeaturedServices(
  limit = 6
): Promise<ServiceWithCategory[]> {
  "use cache";
  cacheTag(CACHE_TAGS.services);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, category:category_id(*), image:image_id(*)")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as unknown as ServiceWithCategory[]).filter(
    (s) => s.category && s.category.is_published
  );
}
