import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { getAdminBlogPost } from "@/lib/actions/blog-admin";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { RichTextRenderer } from "@/components/public/rich-text-renderer";
import { getPublicSiteSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Draft Preview | Blog Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function BlogPostPreviewPage({
  params,
}: PreviewPageProps) {
  await connection();
  const { id } = await params;
  const [postRes, settings] = await Promise.all([
    getAdminBlogPost(id),
    getPublicSiteSettings(),
  ]);

  if (!postRes.success || !postRes.data) {
    notFound();
  }

  const post = postRes.data;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unpublished Draft";

  const featuredImgUrl = post.featured_image
    ? getPublicMediaUrl(post.featured_image.storage_path)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Draft Preview Indicator Banner */}
      <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-200 px-2 py-0.5 font-semibold tracking-wider text-amber-950 uppercase dark:bg-amber-900 dark:text-amber-200">
            Preview Mode
          </span>
          <span>
            Status: <strong className="uppercase">{post.status}</strong> •
            Reading time: ~{post.reading_time_minutes} min • Slug: /{post.slug}
          </span>
        </div>
        <Link
          href="/admin/blog"
          className="font-medium underline hover:text-amber-950 dark:hover:text-amber-100"
        >
          ← Back to Blog Admin
        </Link>
      </div>

      <article className="border-border bg-surface mx-auto max-w-4xl rounded-lg border px-4 py-8 shadow-xs sm:px-6 lg:px-8">
        {/* Breadcrumb Trail */}
        <nav className="text-foreground/60 mb-6 flex flex-wrap items-center gap-1.5 text-xs">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          {post.category && (
            <>
              <span>/</span>
              <span className="hover:text-foreground">
                {post.category.name}
              </span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground max-w-xs truncate font-medium">
            {post.title}
          </span>
        </nav>

        {/* Post Header */}
        <header className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <span className="bg-page-background border-border text-foreground rounded-full border px-2.5 py-1 text-xs font-semibold">
                {post.category.name}
              </span>
            )}
            <span className="text-foreground/60 text-xs">•</span>
            <time className="text-foreground/60 text-xs">{formattedDate}</time>
            <span className="text-foreground/60 text-xs">•</span>
            <span className="text-foreground/60 text-xs">
              {post.reading_time_minutes} min read
            </span>
          </div>

          <h1 className="font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>

          <p className="text-foreground/70 text-sm">
            By{" "}
            <span className="text-foreground font-medium">
              {post.author_name}
            </span>
          </p>
        </header>

        {/* Featured Image */}
        {featuredImgUrl && (
          <div className="border-border bg-page-background relative mb-8 aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={featuredImgUrl}
              alt={post.featured_image?.alt_text || post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
        )}

        {/* Excerpt callout */}
        {post.excerpt && (
          <div className="text-foreground/80 bg-page-background mb-8 rounded-r border-l-4 border-amber-600 py-2 pl-4 font-serif text-base italic sm:text-lg">
            {post.excerpt}
          </div>
        )}

        {/* Rendered Content */}
        <div className="border-border mt-8 border-t pt-8">
          <RichTextRenderer content={post.content} />
        </div>

        {/* CTA Block */}
        <div className="border-border bg-page-background mt-12 space-y-4 rounded-lg border p-6 text-center">
          <h3 className="font-heading text-foreground text-xl font-semibold">
            Looking for Professional Bridal Makeup or Designer Jewellery?
          </h3>
          <p className="text-foreground/70 mx-auto max-w-xl text-xs sm:text-sm">
            Book our bridal services or explore our exclusive jewellery
            collection for your special occasions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/services"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-4 py-2 text-xs font-semibold transition-colors"
            >
              Explore Services
            </Link>
            <Link
              href="/jewellery"
              className="border-border text-foreground hover:bg-surface rounded-md border px-4 py-2 text-xs font-semibold transition-colors"
            >
              Browse Jewellery
            </Link>
            {settings.business.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.business.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
