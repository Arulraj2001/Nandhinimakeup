import type { Metadata } from "next";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getStaticPageSeo } from "@/lib/data/seo";
import { getPublicMediaUrl } from "@/lib/utils/media";

export interface MetadataBuilderOptions {
  /**
   * The page's path, e.g. "/", "/services", "/blog/my-post"
   */
  path: string;

  /**
   * Optional search params from the route.
   * `sort` parameter will be stripped from canonical URL.
   * `page` and filter parameters will be preserved.
   */
  searchParams?: Record<string, string | string[] | undefined>;

  /**
   * Entity or static page override values from the database
   */
  entity?: {
    seo_title?: string | null;
    seo_description?: string | null;
    seo_social_image_url?: string | null;
    seo_social_image_id?: string | null;
    noindex?: boolean;
    canonical_url?: string | null;
  } | null;

  /**
   * Generated defaults from page content (e.g. product title, service description)
   */
  generated?: {
    title?: string;
    description?: string;
    imageUrl?: string | null;
    imageAlt?: string;
  };

  /**
   * Open Graph type: defaults to "website", "article" for blog posts
   */
  type?: "website" | "article";

  /**
   * For listing pages: if false (no items found), page is marked noindex
   */
  hasItems?: boolean;

  /**
   * Force noindex regardless of other flags (e.g. cart, checkout, order, admin)
   */
  forceNoIndex?: boolean;
  /**
   * Optional pre-fetched site settings to avoid redundant data fetch
   */
  settings?: import("@/types/settings").SiteSettingsData;
}

const STATIC_PATHS = new Set([
  "/",
  "/services",
  "/jewellery",
  "/gallery",
  "/reviews",
  "/faq",
  "/about",
  "/contact",
  "/blog",
  "/privacy-policy",
  "/terms-and-conditions",
  "/shipping-returns",
]);

/**
 * Builds standard, compliant Next.js Metadata for any public page.
 * Implements resolution hierarchy: Entity/Page override -> Content default -> Global default.
 */
export async function buildMetadata(
  options: MetadataBuilderOptions
): Promise<Metadata> {
  const settings = options.settings || (await getPublicSiteSettings());
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nandhinimakeup.com";
  const businessName =
    settings.business.business_name || "Nandhini Makeup & Jewellery";
  const tagline =
    settings.business.tagline || "Bridal Makeup & Premium Jewellery";

  // Check static page overrides if this is a static route and no explicit entity was passed
  let staticOverride = null;
  if (!options.entity && STATIC_PATHS.has(options.path)) {
    staticOverride = await getStaticPageSeo(options.path);
  }

  // 1. Resolve Title
  const rawTitle =
    options.entity?.seo_title?.trim() ||
    staticOverride?.title?.trim() ||
    options.generated?.title?.trim() ||
    "";

  let finalTitle: string;
  if (!rawTitle || rawTitle === businessName) {
    finalTitle = `${businessName} | ${tagline}`;
  } else if (rawTitle.includes(businessName)) {
    finalTitle = rawTitle;
  } else {
    finalTitle = `${rawTitle} | ${businessName}`;
  }

  // 2. Resolve Description
  const finalDescription =
    options.entity?.seo_description?.trim() ||
    staticOverride?.description?.trim() ||
    options.generated?.description?.trim() ||
    settings.seo.default_meta_description ||
    settings.business.tagline ||
    "Professional bridal makeup artistry and premium handcrafted jewellery.";

  // 3. Resolve Canonical URL
  let canonicalUrl = "";
  const overrideCanonical =
    options.entity?.canonical_url?.trim() ||
    staticOverride?.canonical_url?.trim();

  if (overrideCanonical) {
    if (overrideCanonical.startsWith("http")) {
      canonicalUrl = overrideCanonical;
    } else {
      canonicalUrl = new URL(overrideCanonical, siteUrl).toString();
    }
  } else {
    // Construct clean URL: strip 'sort', keep 'page' and filters
    const urlObj = new URL(options.path, siteUrl);
    if (options.searchParams) {
      for (const [key, val] of Object.entries(options.searchParams)) {
        if (!val) continue;
        if (key === "sort") continue; // canonicalises to unsorted URL

        const singleVal = Array.isArray(val) ? val[0] : val;
        // Strip page=1 since page=1 is canonical to base URL
        if (key === "page" && singleVal === "1") continue;

        urlObj.searchParams.set(key, singleVal);
      }
    }
    canonicalUrl = urlObj.toString();
  }

  // 4. Resolve Robots
  const isExcludedRoute =
    options.forceNoIndex ||
    options.path.startsWith("/cart") ||
    options.path.startsWith("/checkout") ||
    options.path.startsWith("/order") ||
    options.path.startsWith("/admin");

  const isEntityNoindex =
    Boolean(options.entity?.noindex) ||
    Boolean(staticOverride?.noindex) ||
    options.hasItems === false;

  const robots =
    isExcludedRoute || isEntityNoindex
      ? { index: false, follow: options.hasItems === false }
      : { index: true, follow: true };

  // 5. Resolve Social Image
  let resolvedImageUrl: string | undefined = undefined;
  let imageAlt = options.generated?.imageAlt || finalTitle;
  let imageWidth = 1200;
  let imageHeight = 630;

  if (options.entity?.seo_social_image_url) {
    resolvedImageUrl = options.entity.seo_social_image_url;
  } else if (options.entity?.seo_social_image_id) {
    const media = await getPublicMedia(options.entity.seo_social_image_id);
    if (media) {
      resolvedImageUrl = getPublicMediaUrl(media.storage_path);
      imageAlt = media.alt_text || imageAlt;
      imageWidth = media.width;
      imageHeight = media.height;
    }
  } else if (staticOverride?.media) {
    resolvedImageUrl = getPublicMediaUrl(staticOverride.media.storage_path);
    imageAlt = staticOverride.media.alt_text || imageAlt;
    imageWidth = staticOverride.media.width;
    imageHeight = staticOverride.media.height;
  } else if (staticOverride?.og_image_url) {
    resolvedImageUrl = staticOverride.og_image_url;
  } else if (options.generated?.imageUrl) {
    resolvedImageUrl = options.generated.imageUrl;
  } else if (settings.seo.default_social_image_id) {
    const defaultMedia = await getPublicMedia(
      settings.seo.default_social_image_id
    );
    if (defaultMedia) {
      resolvedImageUrl = getPublicMediaUrl(defaultMedia.storage_path);
      imageAlt = defaultMedia.alt_text || businessName;
      imageWidth = defaultMedia.width;
      imageHeight = defaultMedia.height;
    }
  } else if (settings.branding.logo_media_id) {
    const logoMedia = await getPublicMedia(settings.branding.logo_media_id);
    if (logoMedia) {
      resolvedImageUrl = getPublicMediaUrl(logoMedia.storage_path);
      imageAlt = logoMedia.alt_text || businessName;
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots,
    openGraph: {
      type: options.type || "website",
      title: finalTitle,
      description: finalDescription,
      url: canonicalUrl,
      siteName: businessName,
      locale: "en_IN",
      images: resolvedImageUrl
        ? [
            {
              url: resolvedImageUrl,
              width: imageWidth,
              height: imageHeight,
              alt: imageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: resolvedImageUrl ? [resolvedImageUrl] : undefined,
    },
  };
}
