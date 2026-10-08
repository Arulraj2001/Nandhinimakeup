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
      <article className="group border-border bg-surface hover:border-foreground/30 mb-8 grid grid-cols-1 overflow-hidden rounded-xl border shadow-xs transition-all md:grid-cols-12">
        <div className="bg-page-background relative aspect-video min-h-[260px] overflow-hidden md:col-span-7 md:aspect-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.featured_image?.alt_text || post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-102"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          ) : (
            <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between space-y-4 p-6 sm:p-8 md:col-span-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-900 uppercase dark:bg-amber-950/60 dark:text-amber-300">
                Featured Article
              </span>
              {post.category && (
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="text-foreground/60 hover:text-foreground text-xs font-medium transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
            </div>

            <h2 className="font-heading text-foreground text-xl font-bold tracking-tight transition-colors group-hover:text-amber-700 sm:text-2xl dark:group-hover:text-amber-400">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>

            {post.excerpt && (
              <p className="text-foreground/70 line-clamp-3 text-xs leading-relaxed sm:text-sm">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="border-border text-foreground/60 flex items-center justify-between border-t pt-2 text-xs">
            <div className="flex items-center gap-2">
              <time>{formattedDate}</time>
              <span>•</span>
              <span>{post.reading_time_minutes} min read</span>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="text-foreground flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              Read Article →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group border-border bg-surface hover:border-foreground/30 flex h-full flex-col overflow-hidden rounded-xl border shadow-xs transition-all">
      <Link
        href={`/blog/${post.slug}`}
        className="bg-page-background relative block aspect-video w-full flex-none overflow-hidden"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featured_image?.alt_text || post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-103"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
        <div className="space-y-2">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase hover:underline dark:text-amber-400"
            >
              {post.category.name}
            </Link>
          )}

          <h3 className="font-heading text-foreground line-clamp-2 text-base font-semibold tracking-tight transition-colors group-hover:text-amber-700 sm:text-lg dark:group-hover:text-amber-400">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          {post.excerpt && (
            <p className="text-foreground/70 line-clamp-2 text-xs leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="border-border text-foreground/60 flex items-center justify-between border-t pt-3 text-xs">
          <time>{formattedDate}</time>
          <span>{post.reading_time_minutes} min read</span>
        </div>
      </div>
    </article>
  );
}
