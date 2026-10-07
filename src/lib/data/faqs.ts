import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { FAQ } from "@/types/content";

/**
 * Returns published FAQs.
 * Cached with 'faqs' tag.
 */
export async function getPublicFAQs(params?: {
  group?: string;
}): Promise<FAQ[]> {
  "use cache";
  cacheTag(CACHE_TAGS.faqs);

  const supabase = getStatelessClient();
  let query = supabase
    .from("faqs")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.group && params.group !== "all") {
    query = query.eq(
      "group",
      params.group as
        | "general"
        | "services"
        | "jewellery"
        | "orders_and_shipping"
        | "orders and shipping"
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data;
}
