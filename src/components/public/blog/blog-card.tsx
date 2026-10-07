import Link from "next/link";
import Image from "next/image";
import type { BlogPostWithDetails } from "@/types/blog";
import { getPublicMediaUrl } from "@/lib/utils/media";

interface BlogCardProps {
  post: BlogPostWithDetails;
  isFeaturedHighlight?: boolean;
}

export function BlogCard({ post, isFeaturedHighlight = false }: BlogCardProps) {
  const imageUrl = post.featured_image
    ? getPublicMediaUrl(post.featured_image.storage_path)
    : null;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  if (isFeaturedHighlight) {
    return (
      <article className="group rounded-xl border border-border bg-surface overflow-hidden shadow-xs hover:border-foreground/30 transition-all grid grid-cols-1 md:grid-cols-12 mb-8">
        <div className="md:col-span-7 relative aspect-video md:aspect-auto min-h-[260px] bg-page-background overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.featured_image?.alt_text || post.title}
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground/40 text-xs">
              No image
            </div>
          )}
        </div>

        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                Featured Article
              </span>
              {post.category && (
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
            </div>

            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>

            {post.excerpt && (
              <p className="text-foreground/70 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-foreground/60">
            <div className="flex items-center gap-2">
              <time>{formattedDate}</time>
              <span>•</span>
              <span>{post.reading_time_minutes} min read</span>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="font-semibold text-foreground hover:underline underline-offset-2 flex items-center gap-1"
            >
              Read Article →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group rounded-xl border border-border bg-surface overflow-hidden shadow-xs hover:border-foreground/30 transition-all flex flex-col h-full">
      <Link
        href={`/blog/${post.slug}`}
        className="relative aspect-video w-full bg-page-background overflow-hidden block flex-none"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featured_image?.alt_text || post.title}
            fill
            className="object-cover group-hover:scale-103 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/40 text-xs">
            No image
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
        <div className="space-y-2">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:underline"
            >
              {post.category.name}
            </Link>
          )}

          <h3 className="font-heading text-base sm:text-lg font-semibold tracking-tight text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          {post.excerpt && (
            <p className="text-foreground/70 text-xs line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-foreground/60">
          <time>{formattedDate}</time>
          <span>{post.reading_time_minutes} min read</span>
        </div>
      </div>
    </article>
  );
}
