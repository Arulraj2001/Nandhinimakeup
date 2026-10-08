import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicBlogPosts,
  getPublicBlogCategories,
  getPublicBlogCategoryBySlug,
} from "@/lib/data/blog";
import { BlogCard } from "@/components/public/blog/blog-card";
import { Pagination } from "@/components/public/pagination";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { handleRedirectOrNotFound } from "@/lib/utils/redirects";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const [category, postsData] = await Promise.all([
    getPublicBlogCategoryBySlug(slug),
    getPublicBlogPosts({ categorySlug: slug, page: 1, limit: 1 }),
  ]);

  if (!category) {
    return buildMetadata({
      path: `/blog/category/${slug}`,
      forceNoIndex: true,
      generated: {
        title: "Category Not Found",
      },
    });
  }

  return buildMetadata({
    path: `/blog/category/${slug}`,
    searchParams: sp,
    hasItems: postsData.total > 0,
    entity: {
      seo_title: category.seo_title,
      seo_description: category.seo_description,
      seo_social_image_id: category.seo_social_image_id,
      noindex: category.noindex,
    },
    generated: {
      title: `${category.name} | Blog`,
      description:
        category.description || `Articles and tips in ${category.name}.`,
    },
  });
}

async function BlogCategoryContent({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = Math.max(
    1,
    parseInt(resolvedSearchParams?.page || "1", 10) || 1
  );

  const [category, categories, postsData] = await Promise.all([
    getPublicBlogCategoryBySlug(slug),
    getPublicBlogCategories(),
    getPublicBlogPosts({ categorySlug: slug, page: pageNum, limit: 9 }),
  ]);

  if (!category) {
    await handleRedirectOrNotFound(`/blog/category/${slug}`);
    notFound();
  }

  const { posts, totalPages, currentPage } = postsData;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      {/* Category Header */}
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <div className="text-foreground/60 flex items-center justify-center gap-1.5 text-xs">
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Category</span>
        </div>

        <h1 className="font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {category.name}
        </h1>

        {category.description && (
          <p className="text-foreground/70 text-sm sm:text-base">
            {category.description}
          </p>
        )}
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="border-border flex flex-wrap items-center justify-center gap-2 border-b pb-2">
          <Link
            href="/blog"
            className="text-foreground/70 hover:text-foreground bg-page-background border-border hover:bg-surface rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
          >
            All Articles
          </Link>
          {categories.map((cat) => {
            const isActive = cat.slug === slug;
            return (
              <Link
                key={cat.id}
                href={`/blog/category/${cat.slug}`}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-foreground text-background font-semibold"
                    : "text-foreground/70 hover:text-foreground bg-page-background border-border hover:bg-surface border font-medium"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="border-border bg-surface text-foreground/60 space-y-2 rounded-xl border p-16 text-center">
          <p className="font-heading text-foreground text-lg font-medium">
            No articles in this category yet.
          </p>
          <p className="text-xs">
            <Link href="/blog" className="hover:text-foreground underline">
              View all articles
            </Link>
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/blog/category/${slug}`}
          />
        </div>
      )}
    </div>
  );
}

export default function BlogCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 mx-auto max-w-7xl px-4 py-16 text-center text-sm sm:px-6 lg:px-8">
          Loading category articles...
        </div>
      }
    >
      <BlogCategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
