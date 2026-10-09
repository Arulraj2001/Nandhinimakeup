import type { Metadata } from "next";
import Link from "next/link";
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
import { RecentWorksInstagram } from "@/components/public/home/recent-works-instagram";
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
    getPublicTestimonials({ featuredOnly: true, limit: 8 }),
    getPublicFeaturedGalleryItems({ limit: 12 }),
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

      {/* 8. Recent Works on Instagram (Moving animation, colored grid, links to Reels & Posts) */}
      {galleryTeaser.length > 0 && (
        <RecentWorksInstagram
          items={galleryTeaser}
          instagramUrl={settings.social.instagram_primary || undefined}
        />
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

      {/* 10. Closing Call-to-Action - Luxury South Indian Bridal Atelier Invitation */}
      {hasClosingCta && (
        <EditorialSection className="relative border-t border-[#C5A059]/40 bg-gradient-to-b from-[#FAF8F5] via-[#F4ECE4]/70 to-[#FAF8F5] py-20 sm:py-24 md:py-28 overflow-hidden">
          {/* Ambient decorative glowing backdrops */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-[#C5A059]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-[#8C2524]/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-[#C5A059]/40 bg-gradient-to-br from-white via-[#FAF8F5] to-white p-8 sm:p-12 md:p-14 text-center shadow-lg">
              {/* Decorative top antique gold hairline accent */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-70" />

              {/* Eyebrow badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold tracking-widest text-[#8C2524] uppercase shadow-2xs backdrop-blur-xs">
                <span className="text-[10px] text-[#C5A059] select-none">✦</span>
                <span>Salem Bridal Atelier &amp; Studio</span>
                <span className="text-[10px] text-[#C5A059] select-none">✦</span>
              </div>

              {/* Main Headline */}
              {closingHeadline && (
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl md:text-5xl">
                  {closingHeadline}
                </h2>
              )}

              {/* Supporting Text */}
              {closingText && (
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-[#57534E] sm:text-base">
                  {closingText}
                </p>
              )}

              {/* 3 Luxury Value Pillars */}
              <div className="mx-auto mt-7 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#E5DFD7]/80 bg-white/80 px-3.5 py-2.5 text-center shadow-2xs">
                  <p className="font-heading text-sm font-semibold text-[#8C2524]">
                    500+ Brides Styled
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    HD &amp; Glass Skin Muhoortham
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5DFD7]/80 bg-white/80 px-3.5 py-2.5 text-center shadow-2xs">
                  <p className="font-heading text-sm font-semibold text-[#8C2524]">
                    Salem Bridal Studio
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Private Trials &amp; Saree Draping
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5DFD7]/80 bg-white/80 px-3.5 py-2.5 text-center shadow-2xs">
                  <p className="font-heading text-sm font-semibold text-[#8C2524]">
                    From 3:00 AM Muhurtham
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Outstation Bridal Travel
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                {closingWhatsAppUrl && (
                  <Link
                    href={closingWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-kumkum-glow inline-flex items-center justify-center gap-2 rounded-xl bg-[#15803D] hover:bg-[#166534] px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span>Book on WhatsApp</span>
                  </Link>
                )}

                {hasPhone && (
                  <a
                    href={`tel:${settings.business.phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1C1917] bg-white px-5 py-3.5 text-xs font-semibold tracking-wider text-[#1C1917] uppercase transition-all hover:bg-[#F4ECE4] hover:border-[#8C2524] active:translate-y-[1px]"
                  >
                    <svg
                      className="h-4 w-4 text-[#8C2524]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call {settings.business.phone}</span>
                  </a>
                )}

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C5A059]/60 bg-white/80 px-5 py-3.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-all hover:bg-[#FAF8F5] hover:border-[#8C2524]"
                >
                  <span>Studio &amp; Location</span>
                  <span className="text-[#C5A059]">→</span>
                </Link>
              </div>

              {/* Subtle footer guarantee */}
              <p className="mt-6 text-xs text-[#78716C]">
                📍 Salem, Tamil Nadu • Advance Muhurtham bookings recommended 2–6 months ahead
              </p>
            </div>
          </div>
        </EditorialSection>
      )}
    </div>
  );
}
