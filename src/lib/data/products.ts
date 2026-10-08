import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { ProductWithDetails } from "@/types/products";

export interface PublicProductsParams {
  categorySlug?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface PublicProductsResult {
  products: ProductWithDetails[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Returns paginated, sorted published products whose categories are also published.
 * Cached with 'products' tag.
 */
export async function getPublicProducts(
  params?: PublicProductsParams
): Promise<PublicProductsResult> {
  "use cache";
  cacheTag(CACHE_TAGS.products);

  const supabase = getStatelessClient();
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, params?.limit || 12);
  const sort = params?.sort || "newest";

  let query = supabase
    .from("products")
    .select(
      "*, category:category_id(*), images:product_images(*, media:media_id(*))",
      { count: "exact" }
    )
    .eq("is_published", true);

  if (params?.categorySlug) {
    // First lookup category id to filter
    const { data: cat } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", params.categorySlug)
      .eq("is_published", true)
      .maybeSingle();

    if (!cat) {
      return { products: [], total: 0, totalPages: 0, currentPage: page };
    }
    query = query.eq("category_id", cat.id);
  }

  // Sorting
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    // Newest
    query = query.order("created_at", { ascending: false });
  }

  // Pagination range
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error || !data) {
    return { products: [], total: 0, totalPages: 0, currentPage: page };
  }

  // Format products and sort their images
  const products = (data as unknown as ProductWithDetails[])
    .filter((p) => p.category && p.category.is_published)
    .map((p) => ({
      ...p,
      images: Array.isArray(p.images)
        ? [...p.images].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
        : [],
    }));

  const total = count ?? products.length;
  const totalPages = Math.ceil(total / limit);

  return {
    products,
    total,
    totalPages,
    currentPage: page,
  };
}

/**
 * Returns single published product by category slug and product slug.
 */
export async function getPublicProductBySlug(
  categorySlug: string,
  productSlug: string
): Promise<ProductWithDetails | null> {
  "use cache";
  cacheTag(CACHE_TAGS.products);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:category_id(*), images:product_images(*, media:media_id(*))"
    )
    .eq("slug", productSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const product = data as unknown as ProductWithDetails;
  if (
    !product.category ||
    !product.category.is_published ||
    product.category.slug !== categorySlug
  ) {
    return null;
  }

  product.images = Array.isArray(product.images)
    ? [...product.images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : [];

  return product;
}

/**
 * Checks if a product exists by its slug alone, regardless of category in URL.
 * Used to handle 301 permanent redirect when category segment in URL is wrong.
 */
export async function getPublicProductOnlyBySlug(
  productSlug: string
): Promise<ProductWithDetails | null> {
  "use cache";
  cacheTag(CACHE_TAGS.products);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:category_id(*), images:product_images(*, media:media_id(*))"
    )
    .eq("slug", productSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const product = data as unknown as ProductWithDetails;
  if (!product.category || !product.category.is_published) {
    return null;
  }

  product.images = Array.isArray(product.images)
    ? [...product.images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : [];

  return product;
}

/**
 * Returns up to 4 related published products from the same category.
 */
export async function getPublicRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4
): Promise<ProductWithDetails[]> {
  "use cache";
  cacheTag(CACHE_TAGS.products);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:category_id(*), images:product_images(*, media:media_id(*))"
    )
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .neq("id", excludeProductId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  let list = !error && data ? (data as unknown as ProductWithDetails[]) : [];

  // If category has fewer than limit products, backfill with other published products
  if (list.length < limit) {
    const existingIds = [excludeProductId, ...list.map((p) => p.id)];
    const needed = limit - list.length;
    const { data: fallback } = await supabase
      .from("products")
      .select(
        "*, category:category_id(*), images:product_images(*, media:media_id(*))"
      )
      .eq("is_published", true)
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(needed);

    if (fallback && fallback.length > 0) {
      list = [...list, ...(fallback as unknown as ProductWithDetails[])];
    }
  }

  return list.map((p) => ({
    ...p,
    images: Array.isArray(p.images)
      ? [...p.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      : [],
  }));
}

/**
 * Returns up to 8 featured published products for the Home page.
 */
export async function getPublicFeaturedProducts(
  limit = 8
): Promise<ProductWithDetails[]> {
  "use cache";
  cacheTag(CACHE_TAGS.products);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:category_id(*), images:product_images(*, media:media_id(*))"
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as unknown as ProductWithDetails[])
    .filter((p) => p.category && p.category.is_published)
    .map((p) => ({
      ...p,
      images: Array.isArray(p.images)
        ? [...p.images].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
        : [],
    }));
}
