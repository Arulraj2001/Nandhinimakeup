"use server";

import { z } from "zod";
import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import { isEmptyRichText, type RichTextDoc } from "@/lib/utils/rich-text";
import type { Database, Json } from "@/types/database";

export type LegalPageRecord = Database["public"]["Tables"]["legal_pages"]["Row"];

const legalPageSlugEnum = z.enum([
  "privacy-policy",
  "terms-and-conditions",
  "shipping-and-returns",
]);

const updateLegalPageSchema = z.object({
  slug: legalPageSlugEnum,
  title: z.string().trim().min(1, "Title is required"),
  content: z.custom<RichTextDoc>((val) => val !== undefined && val !== null, {
    message: "Content is required",
  }),
  is_published: z.boolean(),
});

export type UpdateLegalPageInput = z.infer<typeof updateLegalPageSchema>;

/**
 * Returns all three legal pages for admin management.
 */
export async function getAdminLegalPages(): Promise<ActionResult<LegalPageRecord[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("legal_pages")
    .select("*")
    .order("slug", { ascending: true });

  if (error) {
    return actionError(error.message || "Failed to load legal pages");
  }

  return actionSuccess(data || []);
}

/**
 * Updates a legal page's content, title, and publish status.
 * Enforces: Publishing requires non-empty content.
 */
export async function updateLegalPage(
  input: UpdateLegalPageInput
): Promise<ActionResult<LegalPageRecord>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = updateLegalPageSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { slug, title, content, is_published } = parsed.data;

  // Server-side rule: Publishing requires non-empty content
  if (is_published && isEmptyRichText(content)) {
    return actionError("Cannot publish legal page: content cannot be empty.");
  }

  const { data, error } = await auth.data.supabase
    .from("legal_pages")
    .update({
      title,
      content: content as unknown as Json,
      is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    return actionError(error?.message || "Failed to update legal page");
  }

  revalidateCacheTag("legal");

  return actionSuccess(data);
}
