import { getStatelessClient } from "@/lib/supabase/stateless";
import { getPublicMediaUrl } from "@/lib/utils/media";

export interface CartProductLookup {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  stockStatus: "in_stock" | "out_of_stock" | "made_to_order";
  stockQuantity: number | null;
}

/**
 * Server-side lookup that returns current data (name, slug, price, sale price,
 * primary image, stock status, tracked quantity) for a list of product IDs,
 * published products only, using the stateless anon client.
 */
export async function getPublicCartProducts(
  productIds: string[]
): Promise<CartProductLookup[]> {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  // Deduplicate and filter valid IDs
  const uniqueIds = Array.from(
    new Set(productIds.map((id) => id?.trim()))
  ).filter(Boolean);
  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      sale_price,
      stock_status,
      stock_quantity,
      category:category_id (
        slug
      ),
      images:product_images (
        sort_order,
        media:media_id (
          storage_path,
          alt_text
        )
      )
    `
    )
    .in("id", uniqueIds)
    .eq("is_published", true);

  if (error || !data) {
    return [];
  }

  return data.map((item) => {
    const rawCategory = item.category as { slug?: string } | null;
    const rawImages = (item.images || []) as Array<{
      sort_order: number;
      media: { storage_path: string; alt_text: string } | null;
    }>;
    const sortedImages = [...rawImages].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primaryMedia = sortedImages[0]?.media;

    const price = Number(item.price);
    const salePrice = item.sale_price !== null ? Number(item.sale_price) : null;
    const effectivePrice =
      salePrice !== null && salePrice < price ? salePrice : price;

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      categorySlug: rawCategory?.slug || "",
      price,
      salePrice,
      effectivePrice,
      primaryImageUrl: primaryMedia
        ? getPublicMediaUrl(primaryMedia.storage_path)
        : null,
      primaryImageAlt: primaryMedia?.alt_text || item.name,
      stockStatus: item.stock_status as
        "in_stock" | "out_of_stock" | "made_to_order",
      stockQuantity:
        item.stock_quantity !== null ? Number(item.stock_quantity) : null,
    };
  });
}
