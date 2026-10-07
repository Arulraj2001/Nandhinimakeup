import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  settings: "settings",
  media: "media",
  services: "services",
  serviceCategories: "service-categories",
  productCategories: "product-categories",
  products: "products",
} as const;

export type CacheTagKey = keyof typeof CACHE_TAGS;

/**
 * Revalidates cache tags across Next.js.
 * Uses stale-while-revalidate semantics with profile 'max'.
 */
export function revalidateCacheTag(key: CacheTagKey): void {
  try {
    const tag = CACHE_TAGS[key];
    revalidateTag(tag, "max");
  } catch (error) {
    // Gracefully handle environments or phases where cache is unmounted
    console.warn(
      `[revalidateCacheTag] Revalidation skipped for tag "${CACHE_TAGS[key]}":`,
      error
    );
  }
}
