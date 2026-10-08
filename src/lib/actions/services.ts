"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slug";
import { createAutomaticSlugRedirect } from "@/lib/actions/redirects-admin";
import {
  type ServiceCategory,
  type ServiceItem,
  type ServiceWithCategory,
  type SaveCategoryInput,
  type SaveServiceInput,
  saveCategorySchema,
  saveServiceSchema,
} from "@/types/services";

export type { ServiceCategory, ServiceItem, ServiceWithCategory };

export async function getServiceCategories(): Promise<
  ActionResult<ServiceCategory[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(data || []);
}

export async function saveServiceCategory(
  input: SaveCategoryInput
): Promise<ActionResult<ServiceCategory>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const cleanSlug = slugify(parsed.data.slug || parsed.data.name);
  if (!cleanSlug) {
    return actionError("A valid slug is required", {
      slug: ["Slug must contain valid characters"],
    });
  }

  // Check duplicate slug on server
  let checkQuery = auth.data.supabase
    .from("service_categories")
    .select("id")
    .eq("slug", cleanSlug);

  if (parsed.data.id) {
    checkQuery = checkQuery.neq("id", parsed.data.id);
  }

  const { data: existing } = await checkQuery.maybeSingle();
  if (existing) {
    return actionError("Slug is already in use by another category", {
      slug: ["Slug is already in use"],
    });
  }

  if (parsed.data.id) {
    // Update
    const { data, error } = await auth.data.supabase
      .from("service_categories")
      .update({
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        sort_order: parsed.data.sort_order,
        is_published: parsed.data.is_published,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update category.");
    }

    revalidateCacheTag("serviceCategories");
    return actionSuccess(data);
  } else {
    // Insert: get max sort order if not set
    const { data: maxOrderData } = await auth.data.supabase
      .from("service_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("service_categories")
      .insert({
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        sort_order: parsed.data.sort_order || nextOrder,
        is_published: parsed.data.is_published,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create category.");
    }

    revalidateCacheTag("serviceCategories");
    return actionSuccess(data);
  }
}

export async function deleteServiceCategory(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  // Cannot delete a category that has services
  const { data: services, error: checkError } = await auth.data.supabase
    .from("services")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (checkError) {
    return actionError(checkError.message);
  }

  if (services && services.length > 0) {
    return actionError(
      "Cannot delete category: it contains services. Move or delete the services first."
    );
  }

  const { error } = await auth.data.supabase
    .from("service_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete category.");
  }

  revalidateCacheTag("serviceCategories");
  return actionSuccess(undefined);
}

export async function reorderServiceCategories(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("service_categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder categories.");
    }
  }

  revalidateCacheTag("serviceCategories");
  return actionSuccess(undefined);
}

export async function toggleServiceCategoryPublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("service_categories")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to toggle published status.");
  }

  revalidateCacheTag("serviceCategories");
  return actionSuccess(undefined);
}

// ----------------------------------------------------------------------
// Services Actions
// ----------------------------------------------------------------------

export async function getServices(params?: {
  search?: string;
  categoryId?: string;
  isPublished?: boolean;
}): Promise<ActionResult<ServiceWithCategory[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  let query = auth.data.supabase
    .from("services")
    .select("*, category:service_categories(*), image:media(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  if (params?.isPublished !== undefined) {
    query = query.eq("is_published", params.isPublished);
  }

  if (params?.search?.trim()) {
    const s = params.search.trim();
    query = query.or(`name.ilike.%${s}%,short_description.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    return actionError(error.message);
  }

  return actionSuccess((data as unknown as ServiceWithCategory[]) || []);
}

export async function saveService(
  input: SaveServiceInput
): Promise<ActionResult<ServiceItem>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveServiceSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const cleanSlug = slugify(parsed.data.slug || parsed.data.name);
  if (!cleanSlug) {
    return actionError("A valid slug is required", {
      slug: ["Slug must contain valid characters"],
    });
  }

  // Check duplicate slug on server
  let checkQuery = auth.data.supabase
    .from("services")
    .select("id")
    .eq("slug", cleanSlug);

  if (parsed.data.id) {
    checkQuery = checkQuery.neq("id", parsed.data.id);
  }

  const { data: existing } = await checkQuery.maybeSingle();
  if (existing) {
    return actionError("Slug is already in use by another service", {
      slug: ["Slug is already in use"],
    });
  }

  // Sanitize price if on_request
  const priceValue =
    parsed.data.price_type === "on_request" ? null : parsed.data.price;

  if (parsed.data.id) {
    // Check if slug changed to create automatic redirect
    const { data: currentService } = await auth.data.supabase
      .from("services")
      .select("slug")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (currentService && currentService.slug !== cleanSlug) {
      await createAutomaticSlugRedirect(
        auth.data.supabase,
        `/services/${currentService.slug}`,
        `/services/${cleanSlug}`
      );
    }

    // Update
    const { data, error } = await auth.data.supabase
      .from("services")
      .update({
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        slug: cleanSlug,
        short_description: parsed.data.short_description,
        long_description: parsed.data.long_description,
        price_type: parsed.data.price_type,
        price: priceValue,
        duration_minutes: parsed.data.duration_minutes,
        image_id: parsed.data.image_id,
        includes_list: parsed.data.includes_list,
        is_featured: parsed.data.is_featured,
        is_published: parsed.data.is_published,
        sort_order: parsed.data.sort_order,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update service.");
    }

    revalidateCacheTag("services");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  } else {
    // Insert: compute max sort order in this category
    const { data: maxOrderData } = await auth.data.supabase
      .from("services")
      .select("sort_order")
      .eq("category_id", parsed.data.category_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("services")
      .insert({
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        slug: cleanSlug,
        short_description: parsed.data.short_description,
        long_description: parsed.data.long_description,
        price_type: parsed.data.price_type,
        price: priceValue,
        duration_minutes: parsed.data.duration_minutes,
        image_id: parsed.data.image_id,
        includes_list: parsed.data.includes_list,
        is_featured: parsed.data.is_featured,
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

    if (error || !data) {
      return actionError(error?.message || "Failed to create service.");
    }

    revalidateCacheTag("services");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  }
}

export async function deleteService(id: string): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete service.");
  }

  revalidateCacheTag("services");
  return actionSuccess(undefined);
}

export async function toggleServicePublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("services")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update service status.");
  }

  revalidateCacheTag("services");
  return actionSuccess(undefined);
}

export async function toggleServiceFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("services")
    .update({ is_featured: isFeatured })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to update featured status.");
  }

  revalidateCacheTag("services");
  return actionSuccess(undefined);
}

export async function reorderServices(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("services")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder services.");
    }
  }

  revalidateCacheTag("services");
  return actionSuccess(undefined);
}
