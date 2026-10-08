import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicFeaturedServices } from "@/lib/data/services";
import { getPublicFeaturedProducts } from "@/lib/data/products";
import { getPublicFeaturedGalleryItems } from "@/lib/data/gallery";
import { getPublicServiceCategories } from "@/lib/data/service-categories";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { getPublicBlogPosts } from "@/lib/data/blog";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { HomeHero } from "@/components/public/home/home-hero";
import { HomeCounters } from "@/components/public/home/home-counters";
import { CategoryMarquee } from "@/components/public/home/category-marquee";
import { TestimonialsCarousel } from "@/components/public/home/testimonials-carousel";
import { ServiceCard } from "@/components/public/service-card";
import { ProductCard } from "@/components/public/product-card";
import { BlogCard } from "@/components/public/blog/blog-card";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import {
  EditorialSection,
  EditorialEyebrow,
  EditorialStaggerGrid,
} from "@/components/public/editorial-reveal";
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
    latestBlogPosts,
  ] = await Promise.all([
    getPublicSiteSettings(),
    getPublicFeaturedServices(6),
    getPublicFeaturedProducts(8),
    getPublicFeaturedGalleryItems({ type: "before_after", limit: 3 }),
    getPublicServiceCategories(),
    getPublicTestimonials({ featuredOnly: true, limit: 6 }),
    getPublicFeaturedGalleryItems({ limit: 6 }),
    getPublicBlogPosts({ page: 1, limit: 3 }),
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
        <EditorialSection className="py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <EditorialEyebrow
                  eyebrow="✦ Signature Artistry ✦"
                  colorClass="text-[#8C2524]"
                />
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
                  Featured Bridal Packages
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
                  Bespoke Muhurtham HD makeovers, reception glass-skin glows, and
                  saree pleating crafted for South Indian ceremonies.
                </p>
              </div>

              <Link
                href="/services"
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D]"
              >
                View All Services <span>→</span>
              </Link>
            </div>

            <EditorialStaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </EditorialStaggerGrid>
          </div>
        </EditorialSection>
      )}

      {/* 3. Featured Jewellery (Up to eight, skipped if empty) */}
      {featuredProducts.length > 0 && (
        <EditorialSection className="border-t border-[#E5DFD7] bg-[#F4ECE4]/60 py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <EditorialEyebrow
                  eyebrow="✦ Curated Heirloom Collection ✦"
                  colorClass="text-[#C5A059]"
                />
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
                  Featured Jewellery
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
                  Handcrafted antique Nagas temple sets, AD diamond chokers, and
                  Victorian emerald ornaments available for rent from ₹999/day.
                </p>
              </div>

              <Link
                href="/jewellery"
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D]"
              >
                Explore Collection <span>→</span>
              </Link>
            </div>

            <EditorialStaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </EditorialStaggerGrid>
          </div>
        </EditorialSection>
      )}

      {/* 4. Before and After Showcase (Up to three items, skipped if empty) */}
      {beforeAfterGallery.length > 0 && (
        <EditorialSection className="border-t border-[#E5DFD7] bg-[#FAF8F5] py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <EditorialEyebrow
                eyebrow="✦ Real Bridal Transformations ✦"
                colorClass="text-[#8C2524]"
                className="justify-center"
              />
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
                Before &amp; After Artistry
              </h2>
              <p className="mt-3 text-sm text-[#57534E] sm:text-base">
                Slide horizontally to see the meticulous base preparation, HD skin
                match, and ceremonial bridal glow.
              </p>
            </div>

            <EditorialStaggerGrid className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            </EditorialStaggerGrid>
          </div>
        </EditorialSection>
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
        <EditorialSection className="border-t border-[#E5DFD7] bg-[#F4ECE4]/40 py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <EditorialEyebrow
                  eyebrow="✦ Real Moments ✦"
                  colorClass="text-[#C5A059]"
                />
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
                  Artistry in Detail
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
                  A glimpse into our makeup craft, hair design, and bridal
                  elegance across Salem &amp; Tamil Nadu.
                </p>
              </div>

              <Link
                href="/gallery"
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D]"
              >
                View Full Gallery <span>→</span>
              </Link>
            </div>

            <EditorialStaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {galleryTeaser.map((item) => {
                const img = item.media;
                if (!img) return null;
                return (
                  <Link
                    key={item.id}
                    href="/gallery"
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-[#E5DFD7] bg-white transition-all hover:border-[#C5A059]/80 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                  >
                    <Image
                      src={getPublicMediaUrl(img.storage_path)}
                      alt={img.alt_text || item.title || "Gallery thumbnail"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1C1917]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="rounded bg-[#FAF8F5]/90 px-2 py-1 text-[11px] font-semibold text-[#8C2524] uppercase tracking-wider backdrop-blur-xs">
                        View Look →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </EditorialStaggerGrid>
          </div>
        </EditorialSection>
      )}

      {/* 9. Bridal Journal / Beauty Notes (Up to three articles, skipped if empty) */}
      {latestBlogPosts.posts.length > 0 && (
        <EditorialSection className="border-t border-[#E5DFD7] bg-[#FAF8F5] py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <EditorialEyebrow
                  eyebrow="✦ Bridal Journal & Notes ✦"
                  colorClass="text-[#8C2524]"
                />
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
                  Editorial Beauty Guides
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
                  Muhurtham skincare rituals, temple jewellery curation notes, and
                  insider tips from our Salem bridal studio.
                </p>
              </div>

              <Link
                href="/blog"
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D]"
              >
                Read All Articles <span>→</span>
              </Link>
            </div>

            <EditorialStaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
              {latestBlogPosts.posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </EditorialStaggerGrid>
          </div>
        </EditorialSection>
      )}

      {/* 10. Closing Call-to-Action (Skipped if no CTA text/headline) */}
      {hasClosingCta && (
        <EditorialSection className="border-t border-[#C5A059]/40 bg-[#FAF8F5] py-16 text-center sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl rounded-xl border border-[#E5DFD7] bg-white p-8 shadow-sm sm:p-12">
            {closingHeadline && (
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl md:text-5xl">
                {closingHeadline}
              </h2>
            )}

            {closingText && (
              <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-[#57534E] sm:text-lg">
                {closingText}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {closingWhatsAppUrl && (
                <Link
                  href={closingWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-kumkum-glow inline-flex items-center justify-center rounded-md bg-[#8C2524] px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm hover:bg-[#731E1D] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                >
                  Book Consultation on WhatsApp
                </Link>
              )}

              {hasPhone && (
                <a
                  href={`tel:${settings.business.phone}`}
                  className="inline-flex items-center justify-center rounded-md border border-[#1C1917] bg-white px-6 py-3.5 text-xs font-semibold tracking-wider text-[#1C1917] uppercase transition-all hover:bg-[#F4ECE4] active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                >
                  Call {settings.business.phone}
                </a>
              )}
            </div>
          </div>
        </EditorialSection>
      )}
    </div>
  );
}
