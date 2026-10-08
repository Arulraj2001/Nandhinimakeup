import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicFeaturedServices } from "@/lib/data/services";
import { getPublicFeaturedProducts } from "@/lib/data/products";
import { getPublicFeaturedGalleryItems } from "@/lib/data/gallery";
import { getPublicServiceCategories } from "@/lib/data/service-categories";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { HomeHero } from "@/components/public/home/home-hero";
import { HomeCounters } from "@/components/public/home/home-counters";
import { CategoryMarquee } from "@/components/public/home/category-marquee";
import { TestimonialsCarousel } from "@/components/public/home/testimonials-carousel";
import { ServiceCard } from "@/components/public/service-card";
import { ProductCard } from "@/components/public/product-card";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import {
  JsonLdScript,
  buildHomeStructuredData,
} from "@/lib/seo/structured-data";
import { env } from "@/lib/config/env";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const heroMedia = await getPublicMedia(settings.home.hero_image_id);
  const heroUrl = heroMedia ? getPublicMediaUrl(heroMedia.storage_path) : null;

  return buildMetadata({
    path: "/",
    generated: {
      title: "Bridal Makeup Artistry & Curated Jewellery",
      description:
        settings.home.hero_supporting_text ||
        settings.business.tagline ||
        "Professional bridal makeup artistry, saree draping, hairstyling, and handcrafted heirloom jewellery.",
      imageUrl: heroUrl,
      imageAlt: heroMedia?.alt_text || "Nandhini Makeup & Jewellery",
    },
  });
}

export default async function HomePage() {
  const [
    settings,
    featuredServices,
    featuredProducts,
    beforeAfterGallery,
    serviceCategories,
    featuredTestimonials,
    galleryTeaser,
  ] = await Promise.all([
    getPublicSiteSettings(),
    getPublicFeaturedServices(6),
    getPublicFeaturedProducts(8),
    getPublicFeaturedGalleryItems({ type: "before_after", limit: 3 }),
    getPublicServiceCategories(),
    getPublicTestimonials({ featuredOnly: true, limit: 6 }),
    getPublicFeaturedGalleryItems({ limit: 6 }),
  ]);

  // Resolve hero image
  const heroMedia = await getPublicMedia(settings.home.hero_image_id);
  const heroImageUrl = heroMedia
    ? getPublicMediaUrl(heroMedia.storage_path)
    : null;

  // Validate counters (must have non-empty label)
  const validCounters = (settings.home.counters || []).filter(
    (c) => c.label.trim().length > 0
  );
  const hasCounters = validCounters.length > 0;

  // Closing CTA data check
  const closingHeadline = settings.home.closing_cta_headline?.trim();
  const closingText = settings.home.closing_cta_text?.trim();
  const hasClosingCta = Boolean(closingHeadline || closingText);

  const hasPhone = Boolean(settings.business.phone?.trim());
  const hasWhatsApp = Boolean(settings.business.whatsapp_number?.trim());

  const closingWhatsAppUrl = hasWhatsApp
    ? buildWhatsAppLink({
        phoneNumber: settings.business.whatsapp_number,
        greeting: `Hello ${settings.business.business_name}! I would like to enquire about appointments and jewellery bookings:`,
      })
    : "";

  return (
    <div className="flex flex-col">
      <JsonLdScript
        data={buildHomeStructuredData(settings, env.NEXT_PUBLIC_SITE_URL)}
      />
      {/* 1. Hero Section */}
      <HomeHero
        headline={
          settings.home.hero_headline ||
          "Bridal Makeup Artistry & Handcrafted Jewellery"
        }
        supportingText={settings.home.hero_supporting_text}
        heroImageUrl={heroImageUrl}
        heroImageAlt={heroMedia?.alt_text}
        primaryButtonChoice={settings.home.hero_primary_button || "services"}
      />

      {/* 2. Featured Services (Up to six, skipped if empty) */}
      {featuredServices.length > 0 && (
        <section className="py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Signature Artistry
                </p>
                <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  Featured Services
                </h2>
                <p className="text-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
                  Bespoke bridal makeovers, reception looks, and salon
                  treatments designed for your special occasions.
                </p>
              </div>

              <Link
                href="/services"
                className="text-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase hover:underline"
              >
                View All Services <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Featured Jewellery (Up to eight, skipped if empty) */}
      {featuredProducts.length > 0 && (
        <section className="border-border bg-surface/30 border-t py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Curated Collection
                </p>
                <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  Featured Jewellery
                </h2>
                <p className="text-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
                  Handcrafted bridal necklaces, bangles, and temple ornaments
                  that complement your bridal attire.
                </p>
              </div>

              <Link
                href="/jewellery"
                className="text-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase hover:underline"
              >
                Explore Collection <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Before and After Showcase (Up to three items, skipped if empty) */}
      {beforeAfterGallery.length > 0 && (
        <section className="border-border border-t py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
                Real Transformations
              </p>
              <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                Before & After Transformations
              </h2>
              <p className="text-foreground/80 mt-3 text-sm sm:text-base">
                Interact with our comparison slider to see the meticulous
                artistry and radiant transformations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {beforeAfterGallery.map((item) => {
                if (!item.before_media || !item.media) return null;
                return (
                  <BeforeAfterSlider
                    key={item.id}
                    beforeImage={{
                      src: getPublicMediaUrl(item.before_media.storage_path),
                      alt:
                        item.before_media.alt_text ||
                        `${item.title || "Look"} - Before`,
                    }}
                    afterImage={{
                      src: getPublicMediaUrl(item.media.storage_path),
                      alt:
                        item.media.alt_text ||
                        `${item.title || "Look"} - After`,
                    }}
                    title={item.title}
                    caption={item.caption}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Counters (Skipped if no valid counters) */}
      {hasCounters && <HomeCounters counters={validCounters} />}

      {/* 6. Service Category Marquee (CSS-only, skipped if empty) */}
      {serviceCategories.length > 0 && (
        <CategoryMarquee categories={serviceCategories} />
      )}

      {/* 7. Testimonials Carousel (Skipped if empty, no autoplay) */}
      {featuredTestimonials.length > 0 && (
        <TestimonialsCarousel testimonials={featuredTestimonials} />
      )}

      {/* 8. Gallery Teaser (Up to six items linking to /gallery, skipped if empty) */}
      {galleryTeaser.length > 0 && (
        <section className="border-border border-t py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Portfolio Highlights
                </p>
                <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  Artistry in Detail
                </h2>
                <p className="text-foreground/80 mt-2 max-w-xl text-sm sm:text-base">
                  A glimpse into our makeup craft, hair design, and bridal
                  elegance.
                </p>
              </div>

              <Link
                href="/gallery"
                className="text-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase hover:underline"
              >
                View Full Gallery <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {galleryTeaser.map((item) => {
                const img = item.media;
                if (!img) return null;
                return (
                  <Link
                    key={item.id}
                    href="/gallery"
                    className="border-border bg-surface group focus-visible:ring-foreground relative aspect-[3/4] overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Image
                      src={getPublicMediaUrl(img.storage_path)}
                      alt={img.alt_text || item.title || "Gallery thumbnail"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-105"
                    />
                    <div className="bg-foreground/20 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="text-background text-xs font-medium">
                        View →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 9. Closing Call-to-Action (Skipped if no CTA text/headline) */}
      {hasClosingCta && (
        <section className="border-border bg-surface border-t py-16 text-center sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {closingHeadline && (
              <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                {closingHeadline}
              </h2>
            )}

            {closingText && (
              <p className="text-foreground/85 mt-4 text-base leading-relaxed whitespace-pre-line sm:text-lg">
                {closingText}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {closingWhatsAppUrl && (
                <Link
                  href={closingWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Book on WhatsApp
                </Link>
              )}

              {hasPhone && (
                <a
                  href={`tel:${settings.business.phone}`}
                  className="border-foreground/30 text-foreground hover:bg-page-background focus-visible:ring-foreground inline-flex items-center justify-center rounded-md border px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Call {settings.business.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
