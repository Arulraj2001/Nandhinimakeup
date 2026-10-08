import type { MetadataRoute } from "next";
import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import { env } from "@/lib/config/env";
import { isEmptyRichText, type RichTextDoc } from "@/lib/utils/rich-text";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag(
    CACHE_TAGS.services,
    CACHE_TAGS.productCategories,
    CACHE_TAGS.products,
    CACHE_TAGS.blog,
    CACHE_TAGS.legal,
    CACHE_TAGS.seo,
    CACHE_TAGS.redirects,
    CACHE_TAGS.testimonials,
    CACHE_TAGS.faqs,
    CACHE_TAGS.settings
  );

  const supabase = getStatelessClient();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const now = new Date().toISOString();

  // 1. Fetch all dependencies concurrently
  const [
    seoPagesRes,
    redirectsRes,
    servicesRes,
    categoriesRes,
    productsRes,
    testimonialsCountRes,
    faqsCountRes,
    blogPostsRes,
    blogCategoriesRes,
    legalPagesRes,
  ] = await Promise.all([
    supabase.from("seo_pages").select("path, noindex, updated_at"),
    supabase.from("redirects").select("from_path"),
    supabase
      .from("services")
      .select("slug, noindex, updated_at")
      .eq("is_published", true)
      .eq("noindex", false),
    supabase
      .from("product_categories")
      .select("id, slug, noindex, updated_at")
      .eq("is_published", true)
      .eq("noindex", false),
    supabase
      .from("products")
      .select("slug, noindex, updated_at, category:category_id(slug, is_published)")
      .eq("is_published", true)
      .eq("noindex", false),
    supabase
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("faqs")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("blog_posts")
      .select("slug, category_id, noindex, updated_at, published_at")
      .eq("status", "published")
      .lte("published_at", now)
      .eq("noindex", false),
    supabase
      .from("blog_categories")
      .select("id, slug, noindex, updated_at")
      .eq("noindex", false),
    supabase
      .from("legal_pages")
      .select("slug, content, is_published, updated_at")
      .eq("is_published", true),
  ]);

  // Set of redirect source paths to exclude
  const redirectSources = new Set<string>(
    (redirectsRes.data || []).map((r) => r.from_path.toLowerCase())
  );

  // Map of static page SEO overrides
  const staticSeoMap = new Map<string, { noindex: boolean; updated_at: string }>();
  for (const p of seoPagesRes.data || []) {
    staticSeoMap.set(p.path, {
      noindex: Boolean(p.noindex),
      updated_at: p.updated_at,
    });
  }

  const entries: MetadataRoute.Sitemap = [];

  function addUrl(pathname: string, lastModified?: string | Date | null) {
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    // Exclude if path is in redirect sources
    if (redirectSources.has(normalizedPath.toLowerCase())) {
      return;
    }
    // Exclude restricted paths
    if (
      normalizedPath.startsWith("/admin") ||
      normalizedPath === "/cart" ||
      normalizedPath === "/checkout" ||
      normalizedPath.startsWith("/order")
    ) {
      return;
    }

    const fullUrl =
      normalizedPath === "/" ? siteUrl : `${siteUrl}${normalizedPath}`;

    entries.push({
      url: fullUrl,
      lastModified: lastModified ? new Date(lastModified) : new Date(),
    });
  }

  // 1. Home
  if (!staticSeoMap.get("/")?.noindex) {
    addUrl("/", staticSeoMap.get("/")?.updated_at);
  }

  // 2. Services Index & Services
  if (!staticSeoMap.get("/services")?.noindex) {
    addUrl("/services", staticSeoMap.get("/services")?.updated_at);
  }
  for (const s of servicesRes.data || []) {
    addUrl(`/services/${s.slug}`, s.updated_at);
  }

  // 3. Jewellery Index & Categories & Products
  if (!staticSeoMap.get("/jewellery")?.noindex) {
    addUrl("/jewellery", staticSeoMap.get("/jewellery")?.updated_at);
  }
  for (const cat of categoriesRes.data || []) {
    addUrl(`/jewellery/${cat.slug}`, cat.updated_at);
  }
  for (const prod of productsRes.data || []) {
    const cat = prod.category as unknown as { slug?: string; is_published?: boolean } | null;
    if (cat && cat.is_published && cat.slug) {
      addUrl(`/jewellery/${cat.slug}/${prod.slug}`, prod.updated_at);
    }
  }

  // 4. Gallery
  if (!staticSeoMap.get("/gallery")?.noindex) {
    addUrl("/gallery", staticSeoMap.get("/gallery")?.updated_at);
  }

  // 5. Reviews (only when testimonials exist)
  const testimonialsCount = testimonialsCountRes.count || 0;
  if (testimonialsCount > 0 && !staticSeoMap.get("/reviews")?.noindex) {
    addUrl("/reviews", staticSeoMap.get("/reviews")?.updated_at);
  }

  // 6. FAQ (only when FAQs exist)
  const faqsCount = faqsCountRes.count || 0;
  if (faqsCount > 0 && !staticSeoMap.get("/faq")?.noindex) {
    addUrl("/faq", staticSeoMap.get("/faq")?.updated_at);
  }

  // 7. About & Contact
  if (!staticSeoMap.get("/about")?.noindex) {
    addUrl("/about", staticSeoMap.get("/about")?.updated_at);
  }
  if (!staticSeoMap.get("/contact")?.noindex) {
    addUrl("/contact", staticSeoMap.get("/contact")?.updated_at);
  }

  // 8. Blog Index, Posts, and Categories that contain posts
  const publishedPosts = blogPostsRes.data || [];
  if (!staticSeoMap.get("/blog")?.noindex) {
    addUrl("/blog", staticSeoMap.get("/blog")?.updated_at);
  }

  const activeCategoryIds = new Set<string>();
  for (const post of publishedPosts) {
    if (post.category_id) {
      activeCategoryIds.add(post.category_id);
    }
    addUrl(`/blog/${post.slug}`, post.updated_at || post.published_at);
  }

  // Blog categories that contain posts
  for (const bCat of blogCategoriesRes.data || []) {
    if (activeCategoryIds.has(bCat.id)) {
      addUrl(`/blog/category/${bCat.slug}`, bCat.updated_at);
    }
  }

  // 9. Published Legal Pages
  const legalSlugMap: Record<string, string> = {
    "privacy-policy": "/privacy-policy",
    "terms-and-conditions": "/terms-and-conditions",
    "shipping-and-returns": "/shipping-returns",
  };

  for (const lPage of legalPagesRes.data || []) {
    const publicPath = legalSlugMap[lPage.slug];
    if (publicPath) {
      const isContentEmpty = isEmptyRichText(lPage.content as unknown as RichTextDoc);
      if (!isContentEmpty && !staticSeoMap.get(publicPath)?.noindex) {
        addUrl(publicPath, lPage.updated_at);
      }
    }
  }

  return entries;
}
