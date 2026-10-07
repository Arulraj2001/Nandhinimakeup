import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { ProductCategoryWithImage } from "@/types/product-categories";

/**
 * Returns all published product categories ordered by sort_order.
 * Cached with 'product-categories' tag.
 */
export async function getPublicProductCategories(): Promise<
  ProductCategoryWithImage[]
> {
  "use cache";
  cacheTag(CACHE_TAGS.productCategories);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*, image:image_id(*)")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as unknown as ProductCategoryWithImage[];
}

export async function getPublicProductCategoryBySlug(
  slug: string
): Promise<ProductCategoryWithImage | null> {
  "use cache";
  cacheTag(CACHE_TAGS.productCategories);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*, image:image_id(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as ProductCategoryWithImage;
}
