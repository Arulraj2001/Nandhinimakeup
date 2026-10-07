"use server";

import { z } from "zod";
import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import type { Database } from "@/types/database";

export type MediaItem = Database["public"]["Tables"]["media"]["Row"];

const saveMediaSchema = z.object({
  storagePath: z.string().min(1, "Storage path is required"),
  fileName: z.string().min(1, "File name is required"),
  altText: z.string().min(1, "Alt text is required"),
  width: z.number().int().positive("Width must be greater than 0"),
  height: z.number().int().positive("Height must be greater than 0"),
  mimeType: z.string().min(1, "MIME type is required"),
  sizeBytes: z.number().int().positive("Size must be greater than 0"),
});

const updateMediaSchema = z.object({
  id: z.string().uuid("Invalid media ID"),
  fileName: z.string().min(1, "File name cannot be empty"),
  altText: z.string().min(1, "Alt text is required"),
});

export async function saveMediaRecord(
  input: z.infer<typeof saveMediaSchema>
): Promise<ActionResult<MediaItem>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveMediaSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { data, error } = await auth.data.supabase
    .from("media")
    .insert({
      storage_path: parsed.data.storagePath,
      file_name: parsed.data.fileName,
      alt_text: parsed.data.altText,
      width: parsed.data.width,
      height: parsed.data.height,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      created_by: auth.data.userId,
    })
    .select()
    .single();

  if (error || !data) {
    return actionError(error?.message || "Failed to save media metadata.");
  }

  revalidateCacheTag("media");
  return actionSuccess(data);
}

export async function updateMediaRecord(
  input: z.infer<typeof updateMediaSchema>
): Promise<ActionResult<MediaItem>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = updateMediaSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { data, error } = await auth.data.supabase
    .from("media")
    .update({
      file_name: parsed.data.fileName,
      alt_text: parsed.data.altText,
    })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error || !data) {
    return actionError(error?.message || "Failed to update media record.");
  }

  revalidateCacheTag("media");
  return actionSuccess(data);
}

export async function checkMediaUsage(
  mediaId: string,
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >
): Promise<{ inUse: boolean; usageLocation?: string }> {
  // 1. Check site_settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value");

  if (settings) {
    for (const setting of settings) {
      const valStr = JSON.stringify(setting.value);
      if (valStr.includes(mediaId)) {
        return {
          inUse: true,
          usageLocation: `Site Settings (${setting.key})`,
        };
      }
    }
  }

  type DynamicClient = {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          limit: (
            n: number
          ) => Promise<{ data: Array<Record<string, unknown>> | null }>;
        };
      };
    };
  };

  const dynamicDb = supabase as unknown as DynamicClient;

  // 2. Check services if services table exists
  try {
    const { data: services } = await dynamicDb
      .from("services")
      .select("name")
      .eq("image_id", mediaId)
      .limit(1);

    if (services && services.length > 0) {
      const name =
        typeof services[0].name === "string" ? services[0].name : "Service";
      return {
        inUse: true,
        usageLocation: `Service: "${name}"`,
      };
    }
  } catch {
    // Table may not exist yet in this phase step
  }

  // 3. Check product_categories if table exists
  try {
    const { data: categories } = await dynamicDb
      .from("product_categories")
      .select("name")
      .eq("image_id", mediaId)
      .limit(1);

    if (categories && categories.length > 0) {
      const name =
        typeof categories[0].name === "string"
          ? categories[0].name
          : "Category";
      return {
        inUse: true,
        usageLocation: `Product Category: "${name}"`,
      };
    }
  } catch {
    // Table may not exist yet in this phase step
  }

  // 4. Check product_images if table exists
  try {
    const { data: productImages } = await dynamicDb
      .from("product_images")
      .select("id")
      .eq("media_id", mediaId)
      .limit(1);

    if (productImages && productImages.length > 0) {
      return {
        inUse: true,
        usageLocation: "Product Gallery",
      };
    }
  } catch {
    // Table may not exist yet in this phase step
  }

  return { inUse: false };
}

export async function deleteMediaRecord(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  // Check if media is in use
  const usage = await checkMediaUsage(id, auth.data.supabase);
  if (usage.inUse) {
    return actionError(
      `Cannot delete image: it is currently in use by ${usage.usageLocation}.`
    );
  }

  // Fetch record to retrieve storage path
  const { data: record, error: fetchError } = await auth.data.supabase
    .from("media")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !record) {
    return actionError("Media file not found.");
  }

  // Delete from storage bucket
  const { error: storageError } = await auth.data.supabase.storage
    .from("media")
    .remove([record.storage_path]);

  if (storageError) {
    console.warn("Storage deletion warning:", storageError.message);
  }

  // Delete database record
  const { error: dbError } = await auth.data.supabase
    .from("media")
    .delete()
    .eq("id", id);

  if (dbError) {
    return actionError(dbError.message || "Failed to delete media record.");
  }

  revalidateCacheTag("media");
  return actionSuccess(undefined);
}

export async function getMediaList(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    items: MediaItem[];
    totalCount: number;
    page: number;
    totalPages: number;
  }>
> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 24);
  const offset = (page - 1) * pageSize;

  let query = auth.data.supabase
    .from("media")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params?.search?.trim()) {
    const s = params.search.trim();
    query = query.or(`file_name.ilike.%${s}%,alt_text.ilike.%${s}%`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return actionError(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return actionSuccess({
    items: data || [],
    totalCount,
    page,
    totalPages,
  });
}
