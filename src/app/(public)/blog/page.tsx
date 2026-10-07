import type { Metadata } from "next";
import Link from "next/link";
import {
  getPublicBlogPosts,
  getPublicBlogCategories,
} from "@/lib/data/blog";
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

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageNum = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10) || 1);

  const [postsData, categories] = await Promise.all([
    getPublicBlogPosts({ page: pageNum, limit: 9 }),
    getPublicBlogCategories(),
  ]);

  const { posts, total, totalPages, currentPage } = postsData;

  // On page 1, check if the first post is featured
  const featuredPost =
    currentPage === 1 && posts.length > 0 && posts[0].is_featured
      ? posts[0]
      : null;

  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Journal &amp; Beauty Guides
        </h1>
        <p className="text-foreground/70 text-sm sm:text-base">
          Expert beauty advice, bridal makeup preparation, and jewellery styling tips from Nandhini.
        </p>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap pb-2 border-b border-border">
          <Link
            href="/blog"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-foreground text-background transition-colors"
          >
            All Articles
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-foreground/70 hover:text-foreground bg-page-background border border-border hover:bg-surface transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {gridPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : !featuredPost ? (
        <div className="rounded-xl border border-border bg-surface p-16 text-center text-foreground/60 space-y-2">
          <p className="font-heading text-lg font-medium text-foreground">
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
