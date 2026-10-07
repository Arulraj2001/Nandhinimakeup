import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export default async function BlogPostPreviewPage({ params }: PreviewPageProps) {
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
    <div className="space-y-6">
      {/* Draft Preview Indicator Banner */}
      <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200">
            Preview Mode
          </span>
          <span>
            Status: <strong className="uppercase">{post.status}</strong> •
            Reading time: ~{post.reading_time_minutes} min • Slug: /{post.slug}
          </span>
        </div>
        <Link
          href="/admin/blog"
          className="underline font-medium hover:text-amber-950 dark:hover:text-amber-100"
        >
          ← Back to Blog Admin
        </Link>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 rounded-lg border border-border bg-surface shadow-xs">
        {/* Breadcrumb Trail */}
        <nav className="text-xs text-foreground/60 mb-6 flex items-center gap-1.5 flex-wrap">
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
              <span className="hover:text-foreground">{post.category.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-xs">
            {post.title}
          </span>
        </nav>

        {/* Post Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-page-background border border-border text-foreground">
                {post.category.name}
              </span>
            )}
            <span className="text-xs text-foreground/60">•</span>
            <time className="text-xs text-foreground/60">{formattedDate}</time>
            <span className="text-xs text-foreground/60">•</span>
            <span className="text-xs text-foreground/60">
              {post.reading_time_minutes} min read
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {post.title}
          </h1>

          <p className="text-sm text-foreground/70">
            By <span className="font-medium text-foreground">{post.author_name}</span>
          </p>
        </header>

        {/* Featured Image */}
        {featuredImgUrl && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-page-background mb-8">
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
          <div className="text-base sm:text-lg font-serif italic text-foreground/80 border-l-4 border-amber-600 pl-4 py-2 mb-8 bg-page-background rounded-r">
            {post.excerpt}
          </div>
        )}

        {/* Rendered Content */}
        <div className="mt-8 border-t border-border pt-8">
          <RichTextRenderer content={post.content} />
        </div>

        {/* CTA Block */}
        <div className="mt-12 rounded-lg border border-border bg-page-background p-6 text-center space-y-4">
          <h3 className="font-heading text-xl font-semibold text-foreground">
            Looking for Professional Bridal Makeup or Designer Jewellery?
          </h3>
          <p className="text-xs sm:text-sm text-foreground/70 max-w-xl mx-auto">
            Book our bridal services or explore our exclusive jewellery collection for your special occasions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/services"
              className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors"
            >
              Explore Services
            </Link>
            <Link
              href="/jewellery"
              className="px-4 py-2 rounded-md border border-border text-foreground text-xs font-semibold hover:bg-surface transition-colors"
            >
              Browse Jewellery
            </Link>
            {settings.business.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.business.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
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
