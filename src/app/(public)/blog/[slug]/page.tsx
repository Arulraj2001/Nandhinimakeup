import { Suspense } from "react";
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

async function BlogPostDetailContent({ params }: BlogPostPageProps) {
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
        ? [
            {
              label: post.category.name,
              href: `/blog/category/${post.category.slug}`,
            },
          ]
        : []),
      { label: post.title, href: `/blog/${post.slug}` },
    ],
    env.NEXT_PUBLIC_SITE_URL
  );

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <JsonLdScript
        data={[
          ...(blogSchema ? [blogSchema] : []),
          ...(breadcrumbSchema ? [breadcrumbSchema] : []),
        ]}
      />
      {/* Breadcrumb Trail */}
      <nav
        aria-label="Breadcrumb"
        className="text-foreground/60 mb-8 flex flex-wrap items-center gap-1.5 text-xs"
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
        <span className="text-foreground max-w-xs truncate font-medium">
          {post.title}
        </span>
      </nav>

      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="bg-page-background border-border text-foreground hover:bg-surface rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
            >
              {post.category.name}
            </Link>
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

      {/* LCP Featured Image (priority=true, reserved aspect ratio) */}
      {featuredImgUrl && (
        <div className="border-border bg-page-background relative mb-8 aspect-video w-full overflow-hidden rounded-xl border shadow-xs">
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
        <div className="text-foreground/90 bg-[#F4ECE4]/40 mb-8 rounded-r-lg border-l-4 border-[#C5A059] py-3 pl-5 font-serif text-base italic sm:text-lg">
          {post.excerpt}
        </div>
      )}

      {/* Rendered Rich Text Content */}
      <div className="border-border mt-8 border-t pt-8">
        <RichTextRenderer content={post.content} />
      </div>

      {/* Closing Call-To-Action Block */}
      <div className="border-border bg-surface mt-14 space-y-4 rounded-xl border p-8 text-center shadow-xs">
        <h2 className="font-heading text-foreground text-xl font-semibold sm:text-2xl">
          Elevate Your Look with Nandhini
        </h2>
        <p className="text-foreground/70 mx-auto max-w-xl text-xs leading-relaxed sm:text-sm">
          Book a bridal makeup consultation or browse our exclusive designer
          jewellery rental and sale collections.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/services"
            className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Our Services
          </Link>
          <Link
            href="/jewellery"
            className="border-border text-foreground hover:bg-page-background rounded-md border px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Browse Jewellery
          </Link>
          {settings.business.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.business.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-emerald-700"
            >
              WhatsApp Us
            </a>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-border mt-16 space-y-6 border-t pt-12">
          <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedPosts.map((rel) => (
              <BlogCard key={rel.id} post={rel} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default function BlogPostDetailPage({ params }: BlogPostPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 mx-auto max-w-4xl px-4 py-16 text-center text-sm">
          Loading article...
        </div>
      }
    >
      <BlogPostDetailContent params={params} />
    </Suspense>
  );
}
