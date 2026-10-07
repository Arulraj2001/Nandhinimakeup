"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import {
  type GalleryItem,
  type GalleryItemWithDetails,
  type SaveGalleryItemInput,
  saveGalleryItemSchema,
} from "@/types/gallery";

export type { GalleryItem, GalleryItemWithDetails, SaveGalleryItemInput };

export async function getGalleryItems(params?: {
  type?: string;
  serviceCategoryId?: string;
  isPublished?: boolean;
}): Promise<ActionResult<GalleryItemWithDetails[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  let query = auth.data.supabase
    .from("gallery_items")
    .select(
      "*, media:media_id(*), before_media:before_media_id(*), service_category:service_category_id(*)"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.type && params.type !== "all") {
    query = query.eq("type", params.type as "single" | "before_after");
  }

  if (params?.serviceCategoryId && params.serviceCategoryId !== "all") {
    query = query.eq("service_category_id", params.serviceCategoryId);
  }

  if (params?.isPublished !== undefined) {
    query = query.eq("is_published", params.isPublished);
  }

  const { data, error } = await query;
  if (error) {
    return actionError(error.message);
  }

  return actionSuccess((data as unknown as GalleryItemWithDetails[]) || []);
}

export async function saveGalleryItem(
  input: SaveGalleryItemInput
): Promise<ActionResult<GalleryItem>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveGalleryItemSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const beforeMediaId =
    parsed.data.type === "before_after"
      ? parsed.data.before_media_id || null
      : null;

  if (parsed.data.id) {
    // Update
    const { data, error } = await auth.data.supabase
      .from("gallery_items")
      .update({
        type: parsed.data.type,
        media_id: parsed.data.media_id,
        before_media_id: beforeMediaId,
        title: parsed.data.title.trim(),
        caption: parsed.data.caption.trim(),
        service_category_id: parsed.data.service_category_id || null,
        is_featured: parsed.data.is_featured,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update gallery item.");
    }

    revalidateCacheTag("gallery");
    return actionSuccess(data);
  } else {
    // Insert: calculate next sort order
    const { data: maxOrderData } = await auth.data.supabase
      .from("gallery_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("gallery_items")
      .insert({
        type: parsed.data.type,
        media_id: parsed.data.media_id,
        before_media_id: beforeMediaId,
        title: parsed.data.title.trim(),
        caption: parsed.data.caption.trim(),
        service_category_id: parsed.data.service_category_id || null,
        is_featured: parsed.data.is_featured,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order || nextOrder,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create gallery item.");
    }

    revalidateCacheTag("gallery");
    return actionSuccess(data);
  }
}

export async function deleteGalleryItem(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete gallery item.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function toggleGalleryItemPublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update published status.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function toggleGalleryItemFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .update({ is_featured: isFeatured })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update featured status.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function reorderGalleryItems(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("gallery_items")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder gallery items.");
    }
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function bulkPublishGalleryItems(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .update({ is_published: true })
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to publish selected items.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function bulkUnpublishGalleryItems(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .update({ is_published: false })
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to unpublish selected items.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}

export async function bulkDeleteGalleryItems(
  ids: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  if (ids.length === 0) return actionSuccess(undefined);

  const { error } = await auth.data.supabase
    .from("gallery_items")
    .delete()
    .in("id", ids);

  if (error) {
    return actionError(error.message || "Failed to delete selected items.");
  }

  revalidateCacheTag("gallery");
  return actionSuccess(undefined);
}
