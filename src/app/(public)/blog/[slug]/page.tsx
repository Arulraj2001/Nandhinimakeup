import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublicBlogPost, getRelatedBlogPosts } from "@/lib/data/blog";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { RichTextRenderer } from "@/components/public/rich-text-renderer";
import { extractPlainText } from "@/lib/utils/rich-text";
import { BlogCard } from "@/components/public/blog/blog-card";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

import { buildMetadata } from "@/lib/seo/metadata-builder";
import { handleRedirectOrNotFound } from "@/lib/utils/redirects";
import {
  JsonLdScript,
  buildBlogPostStructuredData,
  buildBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";
import { env } from "@/lib/config/env";

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);

  if (!post) {
    return buildMetadata({
      path: `/blog/${slug}`,
      forceNoIndex: true,
      generated: {
        title: "Article Not Found",
      },
    });
  }

  const desc = post.excerpt || extractPlainText(post.content).slice(0, 160);
  const featuredImgUrl = post.featured_image
    ? getPublicMediaUrl(post.featured_image.storage_path)
    : undefined;

  return buildMetadata({
    path: `/blog/${slug}`,
    type: "article",
    entity: {
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      seo_social_image_id: post.seo_social_image_id,
      noindex: post.noindex,
    },
    generated: {
      title: post.title,
      description: desc,
      imageUrl: featuredImgUrl,
      imageAlt: post.featured_image?.alt_text || post.title,
    },
  });
}

export default async function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getPublicBlogPost(slug),
    getPublicSiteSettings(),
  ]);

  if (!post) {
    await handleRedirectOrNotFound(`/blog/${slug}`);
    notFound();
  }

  const relatedPosts = post.category_id
    ? await getRelatedBlogPosts(post.category_id, post.id, 3)
    : [];

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const featuredImgUrl = post.featured_image
    ? getPublicMediaUrl(post.featured_image.storage_path)
    : null;

  const blogSchema = buildBlogPostStructuredData({
    post,
    settings,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
  });

  const breadcrumbSchema = buildBreadcrumbStructuredData(
    [
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      ...(post.category
        ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }]
        : []),
      { label: post.title, href: `/blog/${post.slug}` },
    ],
    env.NEXT_PUBLIC_SITE_URL
  );

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <JsonLdScript
        data={[
          ...(blogSchema ? [blogSchema] : []),
          ...(breadcrumbSchema ? [breadcrumbSchema] : []),
        ]}
      />
      {/* Breadcrumb Trail */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-foreground/60 mb-8 flex items-center gap-1.5 flex-wrap"
      >
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
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="hover:text-foreground"
            >
              {post.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {post.title}
        </span>
      </nav>

      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-page-background border border-border text-foreground hover:bg-surface transition-colors"
            >
              {post.category.name}
            </Link>
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

      {/* LCP Featured Image (priority=true, reserved aspect ratio) */}
      {featuredImgUrl && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-page-background mb-8 shadow-xs">
          <Image
            src={featuredImgUrl}
            alt={post.featured_image?.alt_text || post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
      )}

      {/* Excerpt Lead */}
      {post.excerpt && (
        <div className="text-base sm:text-lg font-serif italic text-foreground/80 border-l-4 border-amber-600 pl-4 py-2 mb-8 bg-surface rounded-r">
          {post.excerpt}
        </div>
      )}

      {/* Rendered Rich Text Content */}
      <div className="mt-8 border-t border-border pt-8">
        <RichTextRenderer content={post.content} />
      </div>

      {/* Closing Call-To-Action Block */}
      <div className="mt-14 rounded-xl border border-border bg-surface p-8 text-center space-y-4 shadow-xs">
        <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground">
          Elevate Your Look with Nandhini
        </h2>
        <p className="text-xs sm:text-sm text-foreground/70 max-w-xl mx-auto leading-relaxed">
          Book a bridal makeup consultation or browse our exclusive designer jewellery rental and sale collections.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/services"
            className="px-5 py-2.5 rounded-md bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors tracking-wider uppercase"
          >
            Our Services
          </Link>
          <Link
            href="/jewellery"
            className="px-5 py-2.5 rounded-md border border-border text-foreground text-xs font-semibold hover:bg-page-background transition-colors tracking-wider uppercase"
          >
            Browse Jewellery
          </Link>
          {settings.business.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.business.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors tracking-wider uppercase"
            >
              WhatsApp Us
            </a>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 border-t border-border pt-12 space-y-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <BlogCard key={rel.id} post={rel} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
