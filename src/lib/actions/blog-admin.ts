"use server";

import { z } from "zod";
import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import {
  calculateReadingTime,
  isEmptyRichText,
  type RichTextDoc,
} from "@/lib/utils/rich-text";
import { slugify } from "@/lib/utils/slug";
import type { BlogCategory, BlogPost, BlogPostWithDetails } from "@/types/blog";
import type { Json } from "@/types/database";

// -----------------------------------------------------------------------------
// Blog Categories Schemas & Actions
// -----------------------------------------------------------------------------

const saveBlogCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Category name is required"),
  slug: z.string().trim().min(1, "Category slug is required"),
  description: z.string().trim().optional().nullable(),
  sort_order: z.number().int().default(0),
  seo_title: z.string().trim().max(70, "SEO title must not exceed 70 characters").nullable().optional(),
  seo_description: z.string().trim().max(200, "SEO description must not exceed 200 characters").nullable().optional(),
  seo_social_image_id: z.string().uuid("Invalid image ID").nullable().optional(),
  noindex: z.boolean().default(false),
  focus_keyword: z.string().trim().nullable().optional(),
});

export type SaveBlogCategoryInput = z.infer<typeof saveBlogCategorySchema>;

export async function getAdminBlogCategories(): Promise<
  ActionResult<BlogCategory[]>
> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return actionError(error.message || "Failed to load blog categories");
  }

  return actionSuccess(data || []);
}

export async function saveBlogCategory(
  input: SaveBlogCategoryInput
): Promise<ActionResult<BlogCategory>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveBlogCategorySchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { id, name, description, sort_order } = parsed.data;
  const slug = slugify(parsed.data.slug);

  // Check unique slug
  let uniqueQuery = auth.data.supabase
    .from("blog_categories")
    .select("id")
    .eq("slug", slug);

  if (id) {
    uniqueQuery = uniqueQuery.neq("id", id);
  }

  const { data: existing } = await uniqueQuery.maybeSingle();
  if (existing) {
    return actionError(`A category with the slug "${slug}" already exists.`);
  }

  if (id) {
    const { data, error } = await auth.data.supabase
      .from("blog_categories")
      .update({
        name,
        slug,
        description: description || null,
        sort_order,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update blog category");
    }

    revalidateCacheTag("blog");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  } else {
    const { data, error } = await auth.data.supabase
      .from("blog_categories")
      .insert({
        name,
        slug,
        description: description || null,
        sort_order,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create blog category");
    }

    revalidateCacheTag("blog");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  }
}

export async function deleteBlogCategory(
  id: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  // Block deletion if any posts exist in this category
  const { count, error: countError } = await auth.data.supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    return actionError("Failed to check posts for this category");
  }

  if (count && count > 0) {
    return actionError(
      `Cannot delete category: it is currently used by ${count} blog post(s). Please reassign or delete those posts first.`
    );
  }

  const { error } = await auth.data.supabase
    .from("blog_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete blog category");
  }

  revalidateCacheTag("blog");
  return actionSuccess(undefined);
}

export async function reorderBlogCategories(
  orderedIds: string[]
): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const updates = orderedIds.map((id, index) =>
    auth.data.supabase
      .from("blog_categories")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  await Promise.all(updates);

  revalidateCacheTag("blog");
  return actionSuccess(undefined);
}

// -----------------------------------------------------------------------------
// Blog Posts Schemas & Actions
// -----------------------------------------------------------------------------

const saveBlogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Post title is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  excerpt: z.string().trim().optional().nullable(),
  content: z.custom<RichTextDoc>((val) => val !== undefined && val !== null, {
    message: "Content is required",
  }),
  featured_image_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  author_name: z.string().trim().default("Nandhini Makeup & Jewellery"),
  status: z.enum(["draft", "published"]),
  published_at: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
  seo_title: z.string().trim().max(70, "SEO title must not exceed 70 characters").nullable().optional(),
  seo_description: z.string().trim().max(200, "SEO description must not exceed 200 characters").nullable().optional(),
  seo_social_image_id: z.string().uuid("Invalid image ID").nullable().optional(),
  noindex: z.boolean().default(false),
  focus_keyword: z.string().trim().nullable().optional(),
});

export type SaveBlogPostInput = z.infer<typeof saveBlogPostSchema>;

export async function getAdminBlogPosts(params?: {
  search?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    items: BlogPostWithDetails[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 20);
  const offset = (page - 1) * pageSize;

  let query = auth.data.supabase
    .from("blog_posts")
    .select(
      "*, category:category_id(*), featured_image:featured_image_id(*), seo_social_image:seo_social_image_id(*)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params?.search?.trim()) {
    const s = params.search.trim();
    query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%,slug.ilike.%${s}%`);
  }

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status as "draft" | "published");
  }

  if (params?.categoryId && params.categoryId !== "all") {
    query = query.eq("category_id", params.categoryId);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return actionError(error.message || "Failed to load blog posts");
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatted: BlogPostWithDetails[] = (data || []).map((p) => ({
    ...p,
    content: (p.content as unknown as RichTextDoc) || { type: "doc", content: [] },
    category: p.category as unknown as BlogCategory | null,
    featured_image: p.featured_image as unknown as BlogPostWithDetails["featured_image"],
    seo_social_image: p.seo_social_image as unknown as BlogPostWithDetails["seo_social_image"],
  }));

  return actionSuccess({
    items: formatted,
    total,
    page,
    pageSize,
    totalPages,
  });
}

export async function getAdminBlogPost(
  id: string
): Promise<ActionResult<BlogPostWithDetails | null>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("blog_posts")
    .select("*, category:category_id(*), featured_image:featured_image_id(*), seo_social_image:seo_social_image_id(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return actionError(error.message || "Failed to load blog post");
  }

  if (!data) {
    return actionSuccess(null);
  }

  const formatted: BlogPostWithDetails = {
    ...data,
    content: (data.content as unknown as RichTextDoc) || { type: "doc", content: [] },
    category: data.category as unknown as BlogCategory | null,
    featured_image: data.featured_image as unknown as BlogPostWithDetails["featured_image"],
    seo_social_image: data.seo_social_image as unknown as BlogPostWithDetails["seo_social_image"],
  };

  return actionSuccess(formatted);
}

export async function saveBlogPost(
  input: SaveBlogPostInput
): Promise<ActionResult<BlogPost>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveBlogPostSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const {
    id,
    title,
    excerpt,
    content,
    featured_image_id,
    category_id,
    author_name,
    status,
    published_at,
    is_featured,
  } = parsed.data;

  const slug = slugify(parsed.data.slug);

  // Server-side publishing rule enforcement:
  // "A post cannot be published without title, excerpt, non-empty content, featured image and category. Enforce on the server and show clear messages."
  if (status === "published") {
    const missing: string[] = [];
    if (!title?.trim()) missing.push("Title");
    if (!excerpt?.trim()) missing.push("Excerpt");
    if (isEmptyRichText(content)) missing.push("Non-empty Content");
    if (!featured_image_id) missing.push("Featured Image");
    if (!category_id) missing.push("Category");

    if (missing.length > 0) {
      return actionError(
        `Cannot publish blog post. The following required fields are missing: ${missing.join(
          ", "
        )}.`
      );
    }
  }

  // Check unique slug
  let uniqueQuery = auth.data.supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug);

  if (id) {
    uniqueQuery = uniqueQuery.neq("id", id);
  }

  const { data: existing } = await uniqueQuery.maybeSingle();
  if (existing) {
    return actionError(`A post with the slug "${slug}" already exists.`);
  }

  // Compute reading time
  const readingTime = calculateReadingTime(content);

  // Published at resolution
  const finalPublishedAt =
    status === "published"
      ? published_at || new Date().toISOString()
      : published_at || null;

  if (id) {
    const { data, error } = await auth.data.supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt: excerpt?.trim() || null,
        content: content as unknown as Json,
        featured_image_id: featured_image_id || null,
        category_id: category_id || null,
        author_name: author_name?.trim() || "Nandhini Makeup & Jewellery",
        status,
        published_at: finalPublishedAt,
        is_featured,
        reading_time_minutes: readingTime,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to update blog post");
    }

    revalidateCacheTag("blog");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  } else {
    const { data, error } = await auth.data.supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt: excerpt?.trim() || null,
        content: content as unknown as Json,
        featured_image_id: featured_image_id || null,
        category_id: category_id || null,
        author_name: author_name?.trim() || "Nandhini Makeup & Jewellery",
        status,
        published_at: finalPublishedAt,
        is_featured,
        reading_time_minutes: readingTime,
        seo_title: parsed.data.seo_title || null,
        seo_description: parsed.data.seo_description || null,
        seo_social_image_id: parsed.data.seo_social_image_id || null,
        noindex: parsed.data.noindex ?? false,
        focus_keyword: parsed.data.focus_keyword || null,
      })
      .select()
      .single();

    if (error || !data) {
      return actionError(error?.message || "Failed to create blog post");
    }

    revalidateCacheTag("blog");
    revalidateCacheTag("seo");
    return actionSuccess(data);
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult<void>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete blog post");
  }

  revalidateCacheTag("blog");
  return actionSuccess(undefined);
}
