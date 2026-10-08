import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicBlogPosts, getPublicBlogCategories } from "@/lib/data/blog";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { BlogCard } from "@/components/public/blog/blog-card";
import { Pagination } from "@/components/public/pagination";
import { buildMetadata } from "@/lib/seo/metadata-builder";

interface BlogIndexPageProps {
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({
  searchParams,
}: BlogIndexPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const postsData = await getPublicBlogPosts({ page: 1, limit: 1 });

  return buildMetadata({
    path: "/blog",
    searchParams: sp,
    hasItems: postsData.total > 0,
    generated: {
      title: "Blog & Beauty Journal",
      description:
        "Expert bridal beauty tips, skincare advice, jewellery styling guides, and parlour insights.",
    },
  });
}

async function BlogIndexContent({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageNum = Math.max(
    1,
    parseInt(resolvedSearchParams?.page || "1", 10) || 1
  );

  const [postsData, categories] = await Promise.all([
    getPublicBlogPosts({ page: pageNum, limit: 9 }),
    getPublicBlogCategories(),
  ]);

  const { posts, totalPages, currentPage } = postsData;

  // On page 1, check if the first post is featured
  const featuredPost =
    currentPage === 1 && posts.length > 0 && posts[0].is_featured
      ? posts[0]
      : null;

  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pt-3 pb-12 sm:px-6 sm:pt-5 sm:pb-16 md:pb-20 lg:px-8">
      <Breadcrumb items={[{ label: "Blog" }]} />

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-foreground/70 mb-1.5 text-xs font-semibold tracking-widest uppercase">
          Bridal Journal
        </p>
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Journal &amp; Beauty Guides
        </h1>
        <p className="text-foreground/80 mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base">
          Expert beauty advice, bridal makeup preparation, and jewellery styling
          tips from Nandhini.
        </p>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="border-border flex flex-wrap items-center justify-center gap-2 border-b pb-2">
          <Link
            href="/blog"
            className="bg-foreground text-background rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
          >
            All Articles
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              className="text-foreground/70 hover:text-foreground bg-page-background border-border hover:bg-surface rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Featured Highlight on Page 1 */}
      {featuredPost && (
        <BlogCard post={featuredPost} isFeaturedHighlight={true} />
      )}

      {/* Posts Grid */}
      {gridPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : !featuredPost ? (
        <div className="border-border bg-surface text-foreground/60 space-y-2 rounded-xl border p-16 text-center">
          <p className="font-heading text-foreground text-lg font-medium">
            No articles published yet.
          </p>
          <p className="text-xs">
            Check back soon for new guides, tips, and updates!
          </p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/blog"
          />
        </div>
      )}
    </div>
  );
}

export default function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 mx-auto max-w-7xl px-4 py-16 text-center text-sm sm:px-6 lg:px-8">
          Loading articles...
        </div>
      }
    >
      <BlogIndexContent searchParams={searchParams} />
    </Suspense>
  );
}
