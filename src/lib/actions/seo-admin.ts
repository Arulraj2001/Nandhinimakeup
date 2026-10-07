"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import {
  saveStaticPageSeoSchema,
  type SaveStaticPageSeoInput,
  type StaticPageSeoRowWithMedia,
  type SeoPageRow,
} from "@/types/seo";
import type { MediaItem } from "@/lib/actions/media";

/**
 * Returns all static page SEO records with media items.
 */
export async function getAdminStaticSeoPages(): Promise<
  ActionResult<StaticPageSeoRowWithMedia[]>
> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("seo_pages")
    .select("*, social_image:og_image_id(*)")
    .order("path", { ascending: true });

  if (error) {
    return actionError(error.message || "Failed to load static SEO pages");
  }

  const formatted: StaticPageSeoRowWithMedia[] = (data || []).map((p) => ({
    ...p,
    social_image: p.social_image as unknown as MediaItem | null,
  }));

  return actionSuccess(formatted);
}

/**
 * Upserts a static page SEO record.
 * Rows are created on first save.
 */
export async function saveStaticPageSeo(
  input: SaveStaticPageSeoInput
): Promise<ActionResult<SeoPageRow>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveStaticPageSeoSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid SEO input";
    return actionError(errorMsg);
  }

  const payload = {
    path: parsed.data.path,
    title: parsed.data.seo_title || "",
    description: parsed.data.seo_description || "",
    og_image_id: parsed.data.seo_social_image_id || null,
    canonical_url: parsed.data.canonical_url || null,
    noindex: parsed.data.noindex,
    focus_keyword: parsed.data.focus_keyword || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.data.supabase
    .from("seo_pages")
    .upsert(payload, { onConflict: "path" })
    .select()
    .single();

  if (error) {
    return actionError(error.message || "Failed to save static page SEO");
  }

  // Revalidate SEO cache tag and the specific public page
  revalidateCacheTag("seo");
  try {
    revalidatePath(parsed.data.path);
  } catch {
    // ignore in server action context if path is root
  }

  return actionSuccess(data as SeoPageRow);
}
