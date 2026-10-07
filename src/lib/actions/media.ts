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
      const val = setting.value as Record<string, unknown> | null;
      if (val && typeof val === "object") {
        if (setting.key === "home" && val.hero_image_id === mediaId) {
          return { inUse: true, usageLocation: "Home Content (Hero Image)" };
        }
        if (setting.key === "about" && val.portrait_image_id === mediaId) {
          return {
            inUse: true,
            usageLocation: "About Content (Portrait Image)",
          };
        }
        if (setting.key === "branding" && val.logo_media_id === mediaId) {
          return { inUse: true, usageLocation: "Branding (Logo)" };
        }
        if (setting.key === "branding" && val.favicon_media_id === mediaId) {
          return { inUse: true, usageLocation: "Branding (Favicon)" };
        }
        if (setting.key === "payments" && val.upi_qr_media_id === mediaId) {
          return { inUse: true, usageLocation: "Payments (UPI QR Code)" };
        }
      }
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

  // 5. Check gallery_items if table exists
  try {
    const { data: galleryItems } = await (
      dynamicDb as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            or: (query: string) => {
              limit: (n: number) => Promise<{
                data: Array<{ title?: string; type?: string }> | null;
              }>;
            };
          };
        };
      }
    )
      .from("gallery_items")
      .select("title, type")
      .or(`media_id.eq.${mediaId},before_media_id.eq.${mediaId}`)
      .limit(1);

    if (galleryItems && galleryItems.length > 0) {
      const itemTitle = galleryItems[0].title
        ? ` "${galleryItems[0].title}"`
        : "";
      return {
        inUse: true,
        usageLocation: `Gallery Item${itemTitle} (${galleryItems[0].type || "single"})`,
      };
    }
  } catch {
    // Table may not exist yet
  }

  // 6. Check legal_pages for rich text content
  try {
    const { data: legalPages } = await (
      supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{
            data: Array<{ title?: string; content?: unknown }> | null;
          }>;
        };
      }
    )
      .from("legal_pages")
      .select("title, content");

    if (legalPages && Array.isArray(legalPages)) {
      for (const page of legalPages) {
        const contentStr = JSON.stringify(page.content || {});
        if (contentStr.includes(mediaId)) {
          return {
            inUse: true,
            usageLocation: `Legal Page: "${page.title || "Untitled"}" (Rich Text)`,
          };
        }
      }
    }
  } catch {
    // Table may not exist yet
  }

  // 7. Check blog_posts for featured image and rich text content
  try {
    const { data: blogPosts } = await (
      supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{
            data: Array<{
              title?: string;
              featured_image_id?: string;
              content?: unknown;
            }> | null;
          }>;
        };
      }
    )
      .from("blog_posts")
      .select("title, featured_image_id, content");

    if (blogPosts && Array.isArray(blogPosts)) {
      for (const post of blogPosts) {
        if (post.featured_image_id === mediaId) {
          return {
            inUse: true,
            usageLocation: `Blog Post: "${post.title || "Untitled"}" (Featured Image)`,
          };
        }
        const contentStr = JSON.stringify(post.content || {});
        if (contentStr.includes(mediaId)) {
          return {
            inUse: true,
            usageLocation: `Blog Post: "${post.title || "Untitled"}" (Rich Text)`,
          };
        }
      }
    }
  } catch {
    // Table may not exist yet
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

export async function getMediaById(
  id: string
): Promise<ActionResult<MediaItem>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return actionError(error?.message || "Media not found.");
  }

  return actionSuccess(data);
}

export async function getMediaMapByIds(
  ids: string[]
): Promise<ActionResult<Record<string, MediaItem>>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const filtered = ids.filter(Boolean);
  if (filtered.length === 0) {
    return actionSuccess({});
  }

  const { data, error } = await auth.data.supabase
    .from("media")
    .select("*")
    .in("id", filtered);

  if (error) {
    return actionError(error.message);
  }

  const map: Record<string, MediaItem> = {};
  for (const item of data || []) {
    map[item.id] = item;
  }

  return actionSuccess(map);
}
