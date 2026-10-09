import type { Metadata } from "next";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { EmptyState } from "@/components/public/empty-state";

import { buildMetadata } from "@/lib/seo/metadata-builder";
import { resolveInstagramData } from "@/lib/utils/instagram";
import { InstagramReelEmbed } from "@/components/public/instagram-reel-embed";

export async function generateMetadata(): Promise<Metadata> {
  const testimonials = await getPublicTestimonials();

  return buildMetadata({
    path: "/reviews",
    hasItems: testimonials.length > 0,
    generated: {
      title: "Client Reviews",
      description:
        "Read real words of love and testimonials from our lovely brides and makeover clients.",
    },
  });
}

export default async function ReviewsPage() {
  const testimonials = await getPublicTestimonials();

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Reviews" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Client Words
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Kind Words & Reviews
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Real experiences, bridal joy, and feedback from the cherished
            clients we have had the honour of styling.
          </p>
        </div>

        {/* Testimonials Grid or Empty State */}
        {testimonials.length === 0 ? (
          <EmptyState message="No reviews have been published yet." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => {
              const insta = resolveInstagramData(t.instagram_url, t.occasion);
              const hasInsta = Boolean(insta.url);

              if (hasInsta && insta.embedUrl) {
                return (
                  <article
                    key={t.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#E5DFD7] bg-white shadow-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md"
                  >
                    <div>
                      {/* Top Live Reel flush with outer card - no inner card */}
                      <InstagramReelEmbed
                        embedUrl={insta.embedUrl}
                        url={insta.url}
                        title={`Instagram Reel for ${t.customer_name}`}
                        height={240}
                        bare={true}
                      />

                      <div className="p-4">
                        {/* Header: Stars + Source */}
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-1 text-[#C5A059]"
                            aria-label={`Rated ${t.rating} out of 5 stars`}
                          >
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < t.rating
                                    ? "fill-[#C5A059] text-[#C5A059]"
                                    : "fill-none stroke-current stroke-2 text-[#E5DFD7]"
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>

                          <span className="rounded-full border border-[#DD2A7B]/25 bg-gradient-to-r from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8C2524]">
                            Reel Story
                          </span>
                        </div>

                        {/* Quote (only if provided) */}
                        {t.quote && t.quote.trim().length > 0 && (
                          <blockquote className="mt-2 text-xs leading-relaxed text-[#57534E] italic line-clamp-2">
                            &ldquo;{t.quote}&rdquo;
                          </blockquote>
                        )}
                      </div>
                    </div>

                    {/* Author Info */}
                    <div className="px-4 pb-4 pt-2 flex items-end justify-between border-t border-[#E5DFD7]/70">
                      <div>
                        <p className="font-heading text-sm font-semibold text-[#1C1917]">
                          {t.customer_name}
                        </p>
                        {t.occasion && (
                          <p className="mt-0.5 text-[11px] font-medium text-[#78716C]">
                            {t.occasion}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 rounded bg-[#F4ECE4]/80 px-1.5 py-0.5 text-[10px] font-medium text-[#8C2524]">
                        <span>✓</span> Verified Bride
                      </span>
                    </div>
                  </article>
                );
              }

              return (
                <article
                  key={t.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E5DFD7] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md"
                >
                  <div>
                    {/* Fallback Instagram Profile button if only handle / profile link */}
                    {hasInsta && !insta.embedUrl && (
                      <a
                        href={insta.url || "https://www.instagram.com/nandhini__makeupartist/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-3.5 flex items-center justify-between rounded-lg border border-[#DD2A7B]/30 bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#DD2A7B] hover:bg-white"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#DD2A7B]">📸</span>
                          <span>{insta.handle || "@nandhini__makeupartist"}</span>
                        </span>
                        <span className="text-[10px] text-[#DD2A7B]">View Profile ↗</span>
                      </a>
                    )}

                    {/* Header: Stars + Source */}
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-1 text-[#C5A059]"
                        aria-label={`Rated ${t.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < t.rating
                                ? "fill-[#C5A059] text-[#C5A059]"
                                : "fill-none stroke-current stroke-2 text-[#E5DFD7]"
                            }`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>

                      {t.source && (
                        <span className="rounded-full border border-[#E5DFD7] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase">
                          {t.source}
                        </span>
                      )}
                    </div>

                    {/* Quote (only if provided) */}
                    {t.quote && t.quote.trim().length > 0 && (
                      <blockquote className="mt-3.5 text-xs sm:text-[13px] leading-relaxed text-[#57534E] italic">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="mt-5 flex items-end justify-between border-t border-[#E5DFD7] pt-3.5">
                    <div>
                      <p className="font-heading text-sm font-semibold text-[#1C1917]">
                        {t.customer_name}
                      </p>
                      {t.occasion && (
                        <p className="mt-0.5 text-[11px] font-medium text-[#78716C]">
                          {t.occasion}
                        </p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 rounded bg-[#F4ECE4]/80 px-1.5 py-0.5 text-[10px] font-medium text-[#8C2524]">
                      <span>✓</span> Verified Bride
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
