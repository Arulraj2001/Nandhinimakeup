import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { Testimonial } from "@/types/content";

/**
 * Returns published testimonials.
 * Cached with 'testimonials' tag.
 */
export async function getPublicTestimonials(params?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<Testimonial[]> {
  "use cache";
  cacheTag(CACHE_TAGS.testimonials);

  const supabase = getStatelessClient();
  let query = supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data;
}
