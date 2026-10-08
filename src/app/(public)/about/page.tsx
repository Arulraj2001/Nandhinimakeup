import type { Metadata } from "next";
import Image from "next/image";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { EmptyState } from "@/components/public/empty-state";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const portraitMedia = await getPublicMedia(settings.about.portrait_image_id);
  const ogImageUrl = portraitMedia
    ? getPublicMediaUrl(portraitMedia.storage_path)
    : undefined;

  return buildMetadata({
    path: "/about",
    generated: {
      title: "About Us",
      description:
        settings.about.story_text?.slice(0, 160) ||
        `Learn about our journey, artistry, and bespoke bridal beauty philosophy at ${settings.business.business_name}.`,
      imageUrl: ogImageUrl,
      imageAlt: portraitMedia?.alt_text || settings.business.business_name,
    },
  });
}

export default async function AboutPage() {
  const settings = await getPublicSiteSettings();
  const portraitMedia = await getPublicMedia(settings.about.portrait_image_id);
  const portraitUrl = portraitMedia
    ? getPublicMediaUrl(portraitMedia.storage_path)
    : null;

  const hasStory = Boolean(settings.about.story_text?.trim());
  const hasHighlights =
    Array.isArray(settings.about.highlights) &&
    settings.about.highlights.filter((h) => h.trim().length > 0).length > 0;
  const validHighlights = (settings.about.highlights || []).filter(
    (h) => h.trim().length > 0
  );

  const hasCounters =
    Array.isArray(settings.home.counters) &&
    settings.home.counters.filter((c) => c.label.trim().length > 0).length > 0;
  const validCounters = (settings.home.counters || []).filter(
    (c) => c.label.trim().length > 0
  );

  const hasContent = hasStory || portraitUrl || hasHighlights || hasCounters;

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "About Us" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Our Journey & Passion
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            About {settings.business.business_name}
          </h1>
          {settings.business.tagline && (
            <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
              {settings.business.tagline}
            </p>
          )}
        </div>

        {!hasContent ? (
          <EmptyState message="About details will be shared soon." />
        ) : (
          <div className="space-y-16 sm:space-y-24">
            {/* Story & Portrait Grid */}
            {(hasStory || portraitUrl) && (
              <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
                {portraitUrl && (
                  <div className="lg:col-span-5">
                    <div className="border-border bg-surface relative aspect-[3/4] w-full overflow-hidden rounded-2xl border shadow-md">
                      <Image
                        src={portraitUrl}
                        alt={portraitMedia?.alt_text || "Artist Portrait"}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                )}

                <div
                  className={`space-y-6 ${
                    portraitUrl
                      ? "lg:col-span-7"
                      : "mx-auto max-w-3xl lg:col-span-12"
                  }`}
                >
                  <h2 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
                    Our Story & Artistry
                  </h2>

                  {hasStory && (
                    <div className="text-foreground/85 space-y-4 text-base leading-relaxed whitespace-pre-line sm:text-lg">
                      {settings.about.story_text}
                    </div>
                  )}

                  {/* Highlights List */}
                  {hasHighlights && (
                    <div className="border-border border-t pt-6">
                      <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
                        What Defines Us
                      </h3>
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {validHighlights.map((highlight, idx) => (
                          <li
                            key={idx}
                            className="text-foreground/85 flex items-start gap-2.5 text-sm"
                          >
                            <span className="text-[#C5A059] mt-0.5 flex-none font-bold">
                              ✦
                            </span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Counters Section */}
            {hasCounters && (
              <section className="border-[#E5DFD7] bg-[#F4ECE4]/50 rounded-2xl border p-8 sm:p-12">
                <div className="mx-auto mb-8 max-w-4xl text-center">
                  <p className="text-[#C5A059] text-xs font-semibold tracking-widest uppercase mb-2">
                    ✦ Heritage of Trust ✦
                  </p>
                  <h2 className="font-serif text-[#1C1917] text-2xl font-normal tracking-wide sm:text-3xl">
                    Milestones & Celebrations
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {validCounters.map((counter, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center p-4 text-center"
                    >
                      <p className="font-serif text-[#1C1917] text-4xl font-normal tracking-tight sm:text-5xl">
                        {counter.number}
                        <span className="text-[#C5A059] font-light">+</span>
                      </p>
                      <p className="text-[#1C1917]/70 mt-2 text-xs font-medium tracking-wider uppercase">
                        {counter.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
