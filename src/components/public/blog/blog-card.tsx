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
              <span className="rounded-md border border-[#C5A059]/40 bg-[#F4ECE4] px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#8C2524] uppercase">
                ✦ Featured Editorial
              </span>
              {post.category && (
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="text-foreground/70 hover:text-[#8C2524] text-xs font-medium transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
            </div>

            <h2 className="font-heading text-foreground text-xl font-bold tracking-tight transition-colors group-hover:text-[#8C2524] sm:text-2xl">
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#E5DFD7] bg-white shadow-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md">
      <Link
        href={`/blog/${post.slug}`}
        className="bg-[#F4ECE4] relative block aspect-video w-full flex-none overflow-hidden"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featured_image?.alt_text || post.title}
            fill
            className="object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.025]"
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
              className="text-[11px] font-semibold tracking-wider text-[#8C2524] uppercase hover:underline"
            >
              {post.category.name}
            </Link>
          )}

          <h3 className="font-heading text-foreground line-clamp-2 text-base font-semibold tracking-tight transition-colors group-hover:text-[#8C2524] sm:text-lg">
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
          <span className="font-medium">{post.reading_time_minutes} min read</span>
        </div>
      </div>

      {/* Editorial Sweeping Gold Hairline on Card Bottom Edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-[#C5A059] transition-all duration-300 ease-out group-hover:w-full"
      />
    </article>
  );
}
