import type { Metadata } from "next";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { EmptyState } from "@/components/public/empty-state";

import { buildMetadata } from "@/lib/seo/metadata-builder";
import { resolveInstagramData } from "@/lib/utils/instagram";

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

              return (
                <article
                  key={t.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E5DFD7] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md"
                >
                  <div>
                    {/* Reel Visual Thumbnail when Instagram link is present */}
                    {hasInsta && (
                      <a
                        href={insta.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Watch ${t.customer_name}'s Reel on Instagram`}
                        className="group/reel relative mb-3.5 flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-[#1C1917] via-[#2F1818] to-[#1C1917] p-3 text-white transition-all duration-300 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-radial from-[#DD2A7B]/25 via-[#8C2524]/15 to-transparent pointer-events-none"
                        />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                            <svg
                              className="h-3 w-3 text-[#E87A5D]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                            <span>Instagram Reel</span>
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">
                            ↗
                          </span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center justify-center gap-1 py-1 text-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-md backdrop-blur-md transition-transform duration-300 group-hover/reel:scale-115 group-hover/reel:bg-[#8C2524]">
                            <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold text-white/90 drop-shadow-xs">
                            Watch Bride Reel ↗
                          </span>
                        </div>
                        <div className="relative z-10 text-left">
                          <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                            {insta.handle || "@nandhini__makeupartist"}
                          </span>
                        </div>
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

                      {!hasInsta && t.source && (
                        <span className="rounded-full border border-[#E5DFD7] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase">
                          {t.source}
                        </span>
                      )}

                      {hasInsta && (
                        <span className="rounded-full border border-[#DD2A7B]/25 bg-gradient-to-r from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8C2524]">
                          Reel Story
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
