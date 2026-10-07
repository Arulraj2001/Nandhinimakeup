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
import {
  type ProductCategory,
  type ProductCategoryWithImage,
  type SaveProductCategoryInput,
  saveProductCategorySchema,
} from "@/types/product-categories";

export type {
  ProductCategory,
  ProductCategoryWithImage,
  SaveProductCategoryInput,
};

export async function getProductCategories(): Promise<
  ActionResult<ProductCategoryWithImage[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*, image:media(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return actionError(error.message);
  }

  return actionSuccess((data as unknown as ProductCategoryWithImage[]) || []);
}

export async function saveProductCategory(
  input: SaveProductCategoryInput
): Promise<ActionResult<ProductCategory>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveProductCategorySchema.safeParse(input);
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
    .from("product_categories")
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
      .from("product_categories")
      .update({
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        image_id: parsed.data.image_id,
        sort_order: parsed.data.sort_order,
        is_published: parsed.data.is_published,
      })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update category.");
    }

    revalidateCacheTag("productCategories");
    return actionSuccess(data);
  } else {
    // Insert: calculate next sort order
    const { data: maxOrderData } = await auth.data.supabase
      .from("product_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

    const { data, error } = await auth.data.supabase
      .from("product_categories")
      .insert({
        name: parsed.data.name,
        slug: cleanSlug,
        description: parsed.data.description,
        image_id: parsed.data.image_id,
        sort_order: parsed.data.sort_order || nextOrder,
        is_published: parsed.data.is_published,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create category.");
    }

    revalidateCacheTag("productCategories");
    return actionSuccess(data);
  }
}

export async function deleteProductCategory(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  // Check if products exist in this category
  try {
    const { data: products } = await (
      auth.data.supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (
              col: string,
              val: string
            ) => {
              limit: (
                n: number
              ) => Promise<{ data: Array<{ id: string }> | null }>;
            };
          };
        };
      }
    )
      .from("products")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (products && products.length > 0) {
      return actionError(
        "Cannot delete category: it contains products. Delete or move the products first."
      );
    }
  } catch {
    // Products table may not exist yet in 2.5
  }

  const { error } = await auth.data.supabase
    .from("product_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete category.");
  }

  revalidateCacheTag("productCategories");
  return actionSuccess(undefined);
}

export async function reorderProductCategories(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await auth.data.supabase
      .from("product_categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) {
      return actionError(error.message || "Failed to reorder categories.");
    }
  }

  revalidateCacheTag("productCategories");
  return actionSuccess(undefined);
}

export async function toggleProductCategoryPublished(
  id: string,
  isPublished: boolean
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("product_categories")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to toggle published status.");
  }

  revalidateCacheTag("productCategories");
  return actionSuccess(undefined);
}
