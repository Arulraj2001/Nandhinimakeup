import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { GalleryItemWithDetails } from "@/types/gallery";

export interface PublicGalleryParams {
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface PublicGalleryResult {
  items: GalleryItemWithDetails[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Returns paginated published gallery items.
 * Cached with 'gallery' tag.
 */
export async function getPublicGalleryItems(
  params?: PublicGalleryParams
): Promise<PublicGalleryResult> {
  "use cache";
  cacheTag(CACHE_TAGS.gallery);

  const supabase = getStatelessClient();
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, params?.limit || 24);

  let query = supabase
    .from("gallery_items")
    .select(
      "*, media:media_id(*), before_media:before_media_id(*), service_category:service_category_id(*)",
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.categoryId && params.categoryId !== "all") {
    query = query.eq("service_category_id", params.categoryId);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error || !data) {
    return { items: [], total: 0, totalPages: 0, currentPage: page };
  }

  const total = count ?? data.length;
  const totalPages = Math.ceil(total / limit);

  return {
    items: data as unknown as GalleryItemWithDetails[],
    total,
    totalPages,
    currentPage: page,
  };
}

/**
 * Returns featured published gallery items for Home page showcase.
 */
export async function getPublicFeaturedGalleryItems(params?: {
  type?: "single" | "before_after";
  limit?: number;
}): Promise<GalleryItemWithDetails[]> {
  "use cache";
  cacheTag(CACHE_TAGS.gallery);

  const supabase = getStatelessClient();
  const limit = params?.limit || 6;

  let query = supabase
    .from("gallery_items")
    .select(
      "*, media:media_id(*), before_media:before_media_id(*), service_category:service_category_id(*)"
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (params?.type) {
    query = query.eq("type", params.type);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data as unknown as GalleryItemWithDetails[];
}
