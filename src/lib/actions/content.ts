"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import {
  type Testimonial,
  type FAQ,
  type Announcement,
  type SaveTestimonialInput,
  type SaveFAQInput,
  type SaveAnnouncementInput,
  saveTestimonialSchema,
  saveFAQSchema,
  saveAnnouncementSchema,
} from "@/types/content";

// ==========================================
// TESTIMONIALS ACTIONS
// ==========================================

export async function getTestimonials(params?: {
  isPublished?: boolean;
}): Promise<ActionResult<Testimonial[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  let query = auth.data.supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.isPublished !== undefined) {
    query = query.eq("is_published", params.isPublished);
  }

  const { data, error } = await query;
  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(data || []);
}

export async function saveTestimonial(
  input: SaveTestimonialInput
): Promise<ActionResult<Testimonial>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.id) {
    const { data, error } = await auth.data.supabase
      .from("testimonials")
      .update({
        customer_name: parsed.data.customer_name.trim(),
        occasion: parsed.data.occasion ? parsed.data.occasion.trim() : null,
        quote: parsed.data.quote.trim(),
        rating: parsed.data.rating,
        source: parsed.data.source,
        is_featured: parsed.data.is_featured,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update testimonial.");
    }

    revalidateCacheTag("testimonials");
    return actionSuccess(data);
  } else {
    const { data: maxOrderData } = await auth.data.supabase
      .from("testimonials")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("testimonials")
      .insert({
        customer_name: parsed.data.customer_name.trim(),
        occasion: parsed.data.occasion ? parsed.data.occasion.trim() : null,
        quote: parsed.data.quote.trim(),
        rating: parsed.data.rating,
        source: parsed.data.source,
        is_featured: parsed.data.is_featured,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order || nextOrder,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create testimonial.");
    }

    revalidateCacheTag("testimonials");
    return actionSuccess(data);
  }
}

export async function deleteTestimonial(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("testimonials")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete testimonial.");
  }

  revalidateCacheTag("testimonials");
  return actionSuccess(undefined);
}

export async function toggleTestimonialPublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("testimonials")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update testimonial status.");
  }

  revalidateCacheTag("testimonials");
  return actionSuccess(undefined);
}

export async function toggleTestimonialFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("testimonials")
    .update({ is_featured: isFeatured })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update featured status.");
  }

  revalidateCacheTag("testimonials");
  return actionSuccess(undefined);
}

export async function reorderTestimonials(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("testimonials")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder testimonials.");
    }
  }

  revalidateCacheTag("testimonials");
  return actionSuccess(undefined);
}

// ==========================================
// FAQS ACTIONS
// ==========================================

export async function getFAQs(params?: {
  group?: string;
  isPublished?: boolean;
}): Promise<ActionResult<FAQ[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  let query = auth.data.supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.group && params.group !== "all") {
    query = query.eq(
      "group",
      params.group as
        | "general"
        | "services"
        | "jewellery"
        | "orders_and_shipping"
        | "orders and shipping"
    );
  }

  if (params?.isPublished !== undefined) {
    query = query.eq("is_published", params.isPublished);
  }

  const { data, error } = await query;
  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(data || []);
}

export async function saveFAQ(input: SaveFAQInput): Promise<ActionResult<FAQ>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveFAQSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.id) {
    const { data, error } = await auth.data.supabase
      .from("faqs")
      .update({
        question: parsed.data.question.trim(),
        answer: parsed.data.answer.trim(),
        group: parsed.data.group,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update FAQ.");
    }

    revalidateCacheTag("faqs");
    return actionSuccess(data);
  } else {
    const { data: maxOrderData } = await auth.data.supabase
      .from("faqs")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("faqs")
      .insert({
        question: parsed.data.question.trim(),
        answer: parsed.data.answer.trim(),
        group: parsed.data.group,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order || nextOrder,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create FAQ.");
    }

    revalidateCacheTag("faqs");
    return actionSuccess(data);
  }
}

export async function deleteFAQ(id: string): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase.from("faqs").delete().eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete FAQ.");
  }

  revalidateCacheTag("faqs");
  return actionSuccess(undefined);
}

export async function toggleFAQPublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("faqs")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update FAQ status.");
  }

  revalidateCacheTag("faqs");
  return actionSuccess(undefined);
}

export async function reorderFAQs(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("faqs")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder FAQs.");
    }
  }

  revalidateCacheTag("faqs");
  return actionSuccess(undefined);
}

// ==========================================
// ANNOUNCEMENTS ACTIONS
// ==========================================

export async function getAnnouncements(): Promise<
  ActionResult<Announcement[]>
> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(data || []);
}

export async function saveAnnouncement(
  input: SaveAnnouncementInput
): Promise<ActionResult<Announcement>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const linkUrl = parsed.data.link_url ? parsed.data.link_url.trim() : null;
  const linkLabel = parsed.data.link_label
    ? parsed.data.link_label.trim()
    : null;
  const startDate = parsed.data.start_date
    ? new Date(parsed.data.start_date).toISOString()
    : null;
  const endDate = parsed.data.end_date
    ? new Date(parsed.data.end_date).toISOString()
    : null;

  if (parsed.data.id) {
    const { data, error } = await auth.data.supabase
      .from("announcements")
      .update({
        message: parsed.data.message.trim(),
        link_url: linkUrl,
        link_label: linkLabel,
        is_active: parsed.data.is_active,
        start_date: startDate,
        end_date: endDate,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update announcement.");
    }

    revalidateCacheTag("announcements");
    return actionSuccess(data);
  } else {
    const { data, error } = await auth.data.supabase
      .from("announcements")
      .insert({
        message: parsed.data.message.trim(),
        link_url: linkUrl,
        link_label: linkLabel,
        is_active: parsed.data.is_active,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create announcement.");
    }

    revalidateCacheTag("announcements");
    return actionSuccess(data);
  }
}

export async function deleteAnnouncement(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete announcement.");
  }

  revalidateCacheTag("announcements");
  return actionSuccess(undefined);
}

export async function toggleAnnouncementActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("announcements")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return actionError(
      error.message || "Failed to update announcement status."
    );
  }

  revalidateCacheTag("announcements");
  return actionSuccess(undefined);
}
