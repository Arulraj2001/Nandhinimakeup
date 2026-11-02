import { NextResponse } from "next/server";
import { getPublicBlogPosts } from "@/lib/data/blog";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { env } from "@/lib/config/env";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [postsRes, settings] = await Promise.all([
    getPublicBlogPosts({ limit: 50 }),
    getPublicSiteSettings(),
  ]);

  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const businessName =
    settings.business.business_name || "Nandhini Makeup & Jewellery";

  const itemsXml = postsRes.posts
    .map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date(post.created_at).toUTCString();
      const author = post.author_name || businessName;
      const title = escapeXml(post.title);
      const desc = escapeXml(post.excerpt || post.title);

      return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(author)}</author>
      <description>${desc}</description>
    </item>`;
    })
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(businessName)} Blog</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(
      settings.business.tagline ||
        "South Indian Bridal Makeup & Antique Jewellery Guides"
    )}</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
