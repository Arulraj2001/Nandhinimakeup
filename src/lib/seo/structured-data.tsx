import * as React from "react";
import type { SiteSettingsData } from "@/types/settings";
import type { ServiceItem } from "@/types/services";
import type { ProductWithDetails } from "@/types/products";
import type { BlogPostWithDetails } from "@/types/blog";
import { getPublicMediaUrl } from "@/lib/utils/media";

// -----------------------------------------------------------------------------
// Safe JSON-LD Serialization Component
// -----------------------------------------------------------------------------

export function JsonLdScript({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>> | null | undefined;
}) {
  if (!data) return null;

  if (Array.isArray(data)) {
    const filtered = data.filter((item) => item && Object.keys(item).length > 0);
    if (filtered.length === 0) return null;
    const jsonString = JSON.stringify(filtered).replace(/</g, "\\u003c");
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonString }}
      />
    );
  }

  if (Object.keys(data).length === 0) return null;
  const jsonString = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

// -----------------------------------------------------------------------------
// 1. Home Page: LocalBusiness (BeautySalon) and WebSite
// -----------------------------------------------------------------------------

export function buildHomeStructuredData(
  settings: SiteSettingsData,
  siteUrl: string
): Array<Record<string, unknown>> {
  const schemas: Array<Record<string, unknown>> = [];
  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");

  // 1. LocalBusiness / BeautySalon
  const business = settings.business;
  const seo = settings.seo;

  if (business?.business_name) {
    const localBusiness: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      "@id": `${cleanSiteUrl}/#business`,
      name: business.business_name,
      url: cleanSiteUrl,
    };

    if (business.tagline) {
      localBusiness.description = business.tagline;
    } else if (seo?.default_meta_description) {
      localBusiness.description = seo.default_meta_description;
    }

    if (business.phone) {
      localBusiness.telephone = business.phone;
    }

    if (business.email) {
      localBusiness.email = business.email;
    }

    if (seo?.price_range) {
      localBusiness.priceRange = seo.price_range;
    }

    if (seo?.area_served) {
      localBusiness.areaServed = seo.area_served;
    }

    // Address
    if (
      business.street_address ||
      business.address_locality ||
      business.address_region ||
      business.postal_code
    ) {
      localBusiness.address = {
        "@type": "PostalAddress",
        streetAddress: business.street_address || undefined,
        addressLocality: business.address_locality || undefined,
        addressRegion: business.address_region || undefined,
        postalCode: business.postal_code || undefined,
        addressCountry: "IN",
      };
    } else if (business.full_address) {
      localBusiness.address = {
        "@type": "PostalAddress",
        streetAddress: business.full_address,
        addressCountry: "IN",
      };
    }

    // Coordinates
    if (
      typeof seo?.latitude === "number" &&
      typeof seo?.longitude === "number" &&
      !isNaN(seo.latitude) &&
      !isNaN(seo.longitude)
    ) {
      localBusiness.geo = {
        "@type": "GeoCoordinates",
        latitude: seo.latitude,
        longitude: seo.longitude,
      };
    }

    // Opening Hours Specification
    if (business.opening_hours) {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ] as const;

      const dayMap: Record<string, string> = {
        monday: "https://schema.org/Monday",
        tuesday: "https://schema.org/Tuesday",
        wednesday: "https://schema.org/Wednesday",
        thursday: "https://schema.org/Thursday",
        friday: "https://schema.org/Friday",
        saturday: "https://schema.org/Saturday",
        sunday: "https://schema.org/Sunday",
      };

      const openingHoursSpecs: Array<Record<string, unknown>> = [];
      for (const day of days) {
        const schedule = business.opening_hours[day];
        if (schedule && !schedule.isClosed && schedule.openTime && schedule.closeTime) {
          openingHoursSpecs.push({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: dayMap[day],
            opens: schedule.openTime,
            closes: schedule.closeTime,
          });
        }
      }

      if (openingHoursSpecs.length > 0) {
        localBusiness.openingHoursSpecification = openingHoursSpecs;
      }
    }

    // Social Profiles (sameAs)
    if (settings.social) {
      const socialUrls = [
        settings.social.instagram_primary,
        settings.social.instagram_secondary,
        settings.social.facebook,
        settings.social.youtube,
      ].filter((u): u is string => Boolean(u && u.trim().startsWith("http")));

      if (socialUrls.length > 0) {
        localBusiness.sameAs = socialUrls;
      }
    }

    schemas.push(localBusiness);
  }

  // 2. WebSite (without search action)
  if (business?.business_name) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${cleanSiteUrl}/#website`,
      url: cleanSiteUrl,
      name: business.business_name,
    });
  }

  return schemas;
}

// -----------------------------------------------------------------------------
// 2. Service Pages: Service with Provider Reference & Offers
// -----------------------------------------------------------------------------

export function buildServiceStructuredData({
  service,
  settings,
  siteUrl,
}: {
  service: ServiceItem & {
    image?: { storage_path: string } | null;
  };
  settings: SiteSettingsData;
  siteUrl: string;
}): Record<string, unknown> | null {
  if (!service?.name) return null;

  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
  const serviceUrl = `${cleanSiteUrl}/services/${service.slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${serviceUrl}/#service`,
    name: service.name,
    url: serviceUrl,
    provider: {
      "@type": "BeautySalon",
      name: settings.business.business_name,
      url: cleanSiteUrl,
    },
  };

  const desc = service.short_description || service.long_description;
  if (desc) {
    schema.description = desc;
  }

  if (service.image?.storage_path) {
    schema.image = getPublicMediaUrl(service.image.storage_path);
  }

  if (settings.seo?.area_served) {
    schema.areaServed = settings.seo.area_served;
  }

  // Offers based on price_type:
  // - fixed: Offer with price
  // - starting_from: minimum-price offer
  // - on_request: none
  if (service.price_type === "fixed" && typeof service.price === "number") {
    schema.offers = {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "INR",
      url: serviceUrl,
    };
  } else if (service.price_type === "starting_from" && typeof service.price === "number") {
    schema.offers = {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: service.price,
        priceCurrency: "INR",
      },
      url: serviceUrl,
    };
  }

  return schema;
}

// -----------------------------------------------------------------------------
// 3. Product Pages: Product with Availability & Sale Price Offer
// -----------------------------------------------------------------------------

export function buildProductStructuredData({
  product,
  categorySlug,
  settings,
  siteUrl,
}: {
  product: ProductWithDetails;
  categorySlug: string;
  settings: SiteSettingsData;
  siteUrl: string;
}): Record<string, unknown> | null {
  if (!product?.name) return null;

  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
  const productUrl = `${cleanSiteUrl}/jewellery/${categorySlug}/${product.slug}`;

  // Availability mapping:
  // in_stock -> https://schema.org/InStock
  // out_of_stock -> https://schema.org/OutOfStock
  // made_to_order -> https://schema.org/PreOrder (documented mapping)
  let availability = "https://schema.org/InStock";
  if (product.stock_status === "out_of_stock") {
    availability = "https://schema.org/OutOfStock";
  } else if (product.stock_status === "made_to_order") {
    availability = "https://schema.org/PreOrder";
  }

  const effectivePrice =
    product.sale_price !== null && product.sale_price !== undefined
      ? product.sale_price
      : product.price;

  const images: string[] = [];
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      if (img.media?.storage_path) {
        images.push(getPublicMediaUrl(img.media.storage_path));
      }
    }
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}/#product`,
    name: product.name,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: settings.business.business_name,
    },
    offers: {
      "@type": "Offer",
      price: effectivePrice,
      priceCurrency: "INR",
      availability,
      url: productUrl,
    },
  };

  if (product.description) {
    schema.description = product.description;
  }

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (images.length > 0) {
    schema.image = images;
  }

  return schema;
}

// -----------------------------------------------------------------------------
// 4. Blog Posts: BlogPosting
// -----------------------------------------------------------------------------

export function buildBlogPostStructuredData({
  post,
  settings,
  siteUrl,
}: {
  post: BlogPostWithDetails;
  settings: SiteSettingsData;
  siteUrl: string;
}): Record<string, unknown> | null {
  if (!post?.title) return null;

  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
  const postUrl = `${cleanSiteUrl}/blog/${post.slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}/#article`,
    headline: post.title,
    url: postUrl,
    mainEntityOfPage: postUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.author_name || settings.business.business_name,
    },
    publisher: {
      "@type": "Organization",
      name: settings.business.business_name,
      url: cleanSiteUrl,
    },
  };

  if (post.excerpt) {
    schema.description = post.excerpt;
  }

  if (post.featured_image?.storage_path) {
    schema.image = getPublicMediaUrl(post.featured_image.storage_path);
  }

  return schema;
}

// -----------------------------------------------------------------------------
// 5. BreadcrumbList (matches visible trail)
// -----------------------------------------------------------------------------

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbStructuredData(
  items: BreadcrumbItem[],
  siteUrl: string
): Record<string, unknown> | null {
  if (!items || items.length === 0) return null;

  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");

  const itemListElement = items.map((item, index) => {
    let itemUrl = cleanSiteUrl;
    if (item.href) {
      itemUrl = item.href.startsWith("http")
        ? item.href
        : `${cleanSiteUrl}${item.href.startsWith("/") ? item.href : `/${item.href}`}`;
    }

    return {
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: itemUrl,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
