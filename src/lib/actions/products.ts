"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import { slugify } from "@/lib/utils/slug";
import {
  type Product,
  type ProductWithDetails,
  type SaveProductInput,
  saveProductSchema,
} from "@/types/products";

export type { Product, ProductWithDetails, SaveProductInput };

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  isPublished?: boolean;
  stockStatus?: string;
}): Promise<ActionResult<ProductWithDetails[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  let query = auth.data.supabase
    .from("products")
    .select(
      "*, category:product_categories(*), images:product_images(*, media(*))"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.categoryId && params.categoryId !== "all") {
    query = query.eq("category_id", params.categoryId);
  }

  if (params?.isPublished !== undefined) {
    query = query.eq("is_published", params.isPublished);
  }

  if (params?.stockStatus && params.stockStatus !== "all") {
    query = query.eq(
      "stock_status",
      params.stockStatus as "in_stock" | "out_of_stock" | "made_to_order"
    );
  }

  if (params?.search?.trim()) {
    const s = params.search.trim();
    query = query.or(
      `name.ilike.%${s}%,description.ilike.%${s}%,sku.ilike.%${s}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    return actionError(error.message);
  }

  // Sort images for each product by sort_order
  const products = (data as unknown as ProductWithDetails[]).map((p) => ({
    ...p,
    images: (p.images || []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return actionSuccess(products);
}

export async function saveProduct(
  input: SaveProductInput
): Promise<ActionResult<Product>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const cleanSlug = slugify(parsed.data.slug || parsed.data.name);
  if (!cleanSlug) {
    return actionError("A valid slug is required", {
      slug: ["Slug must contain valid characters"],
    });
  }

  // Duplicate slug check on server
  let checkQuery = auth.data.supabase
    .from("products")
    .select("id")
    .eq("slug", cleanSlug);

  if (parsed.data.id) {
    checkQuery = checkQuery.neq("id", parsed.data.id);
  }

  const { data: existingSlug } = await checkQuery.maybeSingle();
  if (existingSlug) {
    return actionError("Slug is already in use by another product", {
      slug: ["Slug is already in use"],
    });
  }

  // Duplicate SKU check if provided
  if (parsed.data.sku?.trim()) {
    let skuQuery = auth.data.supabase
      .from("products")
      .select("id")
      .eq("sku", parsed.data.sku.trim());

    if (parsed.data.id) {
      skuQuery = skuQuery.neq("id", parsed.data.id);
    }

    const { data: existingSku } = await skuQuery.maybeSingle();
    if (existingSku) {
      return actionError("SKU is already in use by another product", {
        sku: ["SKU must be unique"],
      });
    }
  }

  let productId = parsed.data.id;

  if (productId) {
    // Update product record
    const { data, error } = await auth.data.supabase
      .from("products")
      .update({
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        price: parsed.data.price,
        sale_price: parsed.data.sale_price,
        sku: parsed.data.sku?.trim() || null,
        stock_status: parsed.data.stock_status,
        stock_quantity: parsed.data.stock_quantity,
        is_featured: parsed.data.is_featured,
        is_new: parsed.data.is_new,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
      })
      .eq("id", productId)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update product.");
    }

    // Refresh images
    await auth.data.supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);

    if (parsed.data.image_ids.length > 0) {
      const imageRows = parsed.data.image_ids.map((mediaId, idx) => ({
        product_id: productId as string,
        media_id: mediaId,
        sort_order: idx,
      }));

      await auth.data.supabase.from("product_images").insert(imageRows);
    }

    revalidateCacheTag("products");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  } else {
    // Insert: calculate sort order
    const { data: maxOrderData } = await auth.data.supabase
      .from("products")
      .select("sort_order")
      .eq("category_id", parsed.data.category_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data: newProduct, error } = await auth.data.supabase
      .from("products")
      .insert({
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        price: parsed.data.price,
        sale_price: parsed.data.sale_price,
        sku: parsed.data.sku?.trim() || null,
        stock_status: parsed.data.stock_status,
        stock_quantity: parsed.data.stock_quantity,
        is_featured: parsed.data.is_featured,
        is_new: parsed.data.is_new,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order || nextOrder,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
      })
      .select()
      .single();

    if (error || !newProduct) {
      return actionError(error?.message || "Failed to create product.");
    }

    productId = newProduct.id;

    if (parsed.data.image_ids.length > 0) {
      const imageRows = parsed.data.image_ids.map((mediaId, idx) => ({
        product_id: productId as string,
        media_id: mediaId,
        sort_order: idx,
      }));

      await auth.data.supabase.from("product_images").insert(imageRows);
    }

    revalidateCacheTag("products");
    return actionSuccess(newProduct);
  }
}

export async function duplicateProduct(
  id: string
): Promise<ActionResult<Product>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  // Fetch original product and its images
  const { data: original, error: fetchErr } = await auth.data.supabase
    .from("products")
    .select("*, images:product_images(*)")
    .eq("id", id)
    .single();

  if (fetchErr || !original) {
    return actionError("Original product not found.");
  }

  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  const newName = `Copy of ${original.name}`;
  const newSlug = slugify(`copy-of-${original.slug}-${suffix}`);

  const { data: newProduct, error: insertErr } = await auth.data.supabase
    .from("products")
    .insert({
      category_id: original.category_id,
      name: newName,
      slug: newSlug,
      description: original.description,
      price: original.price,
      sale_price: original.sale_price,
      sku: null, // do not duplicate SKU to avoid conflict
      stock_status: original.stock_status,
      stock_quantity: original.stock_quantity,
      is_featured: false,
      is_new: true,
      is_published: false, // always unpublished copy
      sort_order: original.sort_order + 1,
    })
    .select()
    .single();

  if (insertErr || !newProduct) {
    return actionError(insertErr?.message || "Failed to duplicate product.");
  }

  // Copy images
  if (original.images && original.images.length > 0) {
    const copiedImages = original.images.map(
      (img: { media_id: string; sort_order: number }) => ({
        product_id: newProduct.id,
        media_id: img.media_id,
        sort_order: img.sort_order,
      })
    );

    await auth.data.supabase.from("product_images").insert(copiedImages);
  }

  revalidateCacheTag("products");
  return actionSuccess(newProduct);
}

export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete product.");
  }

  revalidateCacheTag("products");
  return actionSuccess(undefined);
}

// ----------------------------------------------------------------------
// Bulk Actions
// ----------------------------------------------------------------------
export async function bulkPublishProducts(
  ids: string[]
): Promise<ActionResult<{ publishedCount: number; rejectedCount: number }>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) {
    return actionSuccess({ publishedCount: 0, rejectedCount: 0 });
  }

  // Enforce rule: cannot publish products without images
  const { data: productsWithImages } = await auth.data.supabase
    .from("products")
    .select("id, images:product_images(id)")
    .in("id", ids);

  const eligibleIds: string[] = [];
  let rejectedCount = 0;

  for (const p of productsWithImages || []) {
    if (p.images && p.images.length > 0) {
      eligibleIds.push(p.id);
    } else {
      rejectedCount++;
    }
  }

  if (eligibleIds.length > 0) {
    await auth.data.supabase
      .from("products")
      .update({ is_published: true })
      .in("id", eligibleIds);
  }

  revalidateCacheTag("products");
  return actionSuccess({
    publishedCount: eligibleIds.length,
    rejectedCount,
  });
}

export async function bulkUnpublishProducts(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("products")
    .update({ is_published: false })
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to unpublish products.");
  }

  revalidateCacheTag("products");
  return actionSuccess(undefined);
}

export async function bulkMarkOutOfStock(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("products")
    .update({ stock_status: "out_of_stock" })
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to update stock status.");
  }

  revalidateCacheTag("products");
  return actionSuccess(undefined);
}

export async function bulkDeleteProducts(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("products")
    .delete()
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to delete selected products.");
  }

  revalidateCacheTag("products");
  return actionSuccess(undefined);
}
