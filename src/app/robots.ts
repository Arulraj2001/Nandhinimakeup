import type { MetadataRoute } from "next";
import { env } from "@/lib/config/env";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = env.ALLOW_INDEXING;

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/cart",
        "/checkout",
        "/order",
        "/order/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
