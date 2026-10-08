import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { BlogCategory, BlogPostWithDetails } from "@/types/blog";
import type { RichTextDoc } from "@/lib/utils/rich-text";

export interface PublicBlogPostsResult {
  posts: BlogPostWithDetails[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Checks whether at least one published blog post exists.
 * Used by Header navigation to conditionally show the "Blog" link.
 */
export async function hasPublishedBlogPosts(): Promise<boolean> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();
  const nowIso = new Date().toISOString();

  const { count, error } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .lte("published_at", nowIso);

  if (error || !count) {
    return false;
  }

  return count > 0;
}

/**
 * Returns all blog categories for navigation and filtering.
 */
export async function getPublicBlogCategories(): Promise<BlogCategory[]> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Returns a category by its slug.
 */
export async function getPublicBlogCategoryBySlug(
  slug: string
): Promise<BlogCategory | null> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Returns paginated published blog posts.
 * 9 posts per page, newest first.
 * On page 1, a featured post is highlighted first if one exists.
 */
export async function getPublicBlogPosts(params?: {
  categorySlug?: string;
  page?: number;
  limit?: number;
}): Promise<PublicBlogPostsResult> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();
  const nowIso = new Date().toISOString();

  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, params?.limit || 9);
  const offset = (page - 1) * limit;

  let categoryId: string | null = null;
  if (params?.categorySlug) {
    const cat = await getPublicBlogCategoryBySlug(params.categorySlug);
    if (!cat) {
      return { posts: [], total: 0, totalPages: 0, currentPage: page };
    }
    categoryId = cat.id;
  }

  let query = supabase
    .from("blog_posts")
    .select("*, category:category_id(*), featured_image:featured_image_id(*)", {
      count: "exact",
    })
    .eq("status", "published")
    .lte("published_at", nowIso);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // On page 1, order with featured posts first, then newest published_at
  if (page === 1) {
    query = query
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return { posts: [], total: 0, totalPages: 0, currentPage: page };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  const formatted: BlogPostWithDetails[] = (data || []).map((p) => ({
    ...p,
    content: (p.content as unknown as RichTextDoc) || {
      type: "doc",
      content: [],
    },
    category: p.category as unknown as BlogCategory | null,
    featured_image:
      p.featured_image as unknown as BlogPostWithDetails["featured_image"],
  }));

  return {
    posts: formatted,
    total,
    totalPages,
    currentPage: page,
  };
}

/**
 * Returns a single published blog post by slug.
 * Future-dated or draft posts return null.
 */
export async function getPublicBlogPost(
  slug: string
): Promise<BlogPostWithDetails | null> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, category:category_id(*), featured_image:featured_image_id(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    content: (data.content as unknown as RichTextDoc) || {
      type: "doc",
      content: [],
    },
    category: data.category as unknown as BlogCategory | null,
    featured_image:
      data.featured_image as unknown as BlogPostWithDetails["featured_image"],
  };
}

/**
 * Returns up to 3 related published posts from the same category.
 */
export async function getRelatedBlogPosts(
  categoryId: string,
  excludePostId: string,
  limit = 3
): Promise<BlogPostWithDetails[]> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const supabase = getStatelessClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, category:category_id(*), featured_image:featured_image_id(*)")
    .eq("category_id", categoryId)
    .neq("id", excludePostId)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false })
    .limit(limit);

  let list = !error && data ? (data as unknown as BlogPostWithDetails[]) : [];

  // If category has fewer than limit posts, backfill with other published posts
  if (list.length < limit) {
    const existingIds = [excludePostId, ...list.map((p) => p.id)];
    const needed = limit - list.length;
    const { data: fallback } = await supabase
      .from("blog_posts")
      .select("*, category:category_id(*), featured_image:featured_image_id(*)")
      .not("id", "in", `(${existingIds.join(",")})`)
      .eq("status", "published")
      .lte("published_at", nowIso)
      .order("published_at", { ascending: false })
      .limit(needed);

    if (fallback && fallback.length > 0) {
      list = [...list, ...(fallback as unknown as BlogPostWithDetails[])];
    }
  }

  return list.map((p) => ({
    ...p,
    content: (p.content as unknown as RichTextDoc) || {
      type: "doc",
      content: [],
    },
    category: p.category as unknown as BlogCategory | null,
    featured_image:
      p.featured_image as unknown as BlogPostWithDetails["featured_image"],
  }));
}
