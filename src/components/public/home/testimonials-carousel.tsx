"use client";

import * as React from "react";
import Link from "next/link";
import type { Testimonial } from "@/types/content";
import { resolveInstagramData } from "@/lib/utils/instagram";
import { InstagramReelEmbed } from "@/components/public/instagram-reel-embed";

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  if (!testimonials || testimonials.length === 0) return null;

  // Duplicate items for continuous auto-moving loop
  const displayItems =
    testimonials.length < 5
      ? [...testimonials, ...testimonials, ...testimonials, ...testimonials]
      : [...testimonials, ...testimonials];

  const handlePrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-[#E5DFD7] bg-bridal-grid-gold py-16 sm:py-20 md:py-24">
      {/* Decorative ambient gold glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#C5A059]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#8C2524]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header with Controls */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8C2524]" />
              <p className="text-xs font-semibold tracking-widest text-[#8C2524] uppercase">
                ✦ Salem Bride Experiences ✦
              </p>
            </div>
            <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
              Words of Love &amp; Instagram Stories
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
              Real bridal joy, Muhurtham makeup reviews, and authentic client
              experiences styled with devotion by Nandhini.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/reviews"
              className="hidden items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D] sm:inline-flex"
            >
              All Reviews <span>→</span>
            </Link>

            {/* Prev / Next manual controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#E5DFD7] bg-white text-[#1C1917] shadow-xs transition-all hover:border-[#8C2524] hover:bg-[#8C2524] hover:text-white focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#E5DFD7] bg-white text-[#1C1917] shadow-xs transition-all hover:border-[#8C2524] hover:bg-[#8C2524] hover:text-white focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Moving Animation Track: Continuous auto-glide + hover pause */}
        <div
          className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Subtle fade edges for smooth infinite aesthetic */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#FAF7F2] to-transparent sm:w-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#FAF7F2] to-transparent sm:w-20"
          />

          <div
            ref={scrollContainerRef}
            className={`animate-marquee-cards flex items-stretch gap-5 py-4 ${
              isPaused ? "[animation-play-state:paused]" : ""
            }`}
          >
            {displayItems.map((t, idx) => {
              const insta = resolveInstagramData(t.instagram_url, t.occasion);
              const hasInsta = Boolean(insta.url);

              return (
                <div
                  key={`${t.id}-${idx}`}
                  className="w-[290px] flex-none sm:w-[320px] md:w-[340px]"
                >
                  <article className="flex h-full flex-col justify-between rounded-xl border border-[#E5DFD7]/90 bg-white/95 p-5 shadow-xs backdrop-blur-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md hover:-translate-y-1">
                    <div>
                      {/* Real Instagram Reel Embed when link is present */}
                      {hasInsta && insta.embedUrl && (
                        <div className="mb-3.5">
                          <InstagramReelEmbed
                            embedUrl={insta.embedUrl}
                            url={insta.url}
                            title={`Instagram Reel for ${t.customer_name}`}
                            height={360}
                          />
                        </div>
                      )}

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

                      {/* Card Header: Stars + Source */}
                      <div className="flex items-center justify-between">
                        {/* Gold Star Rating */}
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

                        {/* Top Source / Instagram badge if no reel thumbnail above */}
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

                      {/* Quote text (only if provided) */}
                      {t.quote && t.quote.trim().length > 0 && (
                        <blockquote className="mt-3 text-xs sm:text-[13px] leading-relaxed text-[#57534E] italic line-clamp-3">
                          &ldquo;{t.quote}&rdquo;
                        </blockquote>
                      )}
                    </div>

                    {/* Author Footer */}
                    <div className="mt-5 flex items-end justify-between border-t border-[#E5DFD7]/80 pt-3.5">
                      <div>
                        <p className="font-heading text-sm font-semibold tracking-tight text-[#1C1917]">
                          {t.customer_name}
                        </p>
                        {t.occasion && (
                          <p className="mt-0.5 text-[11px] font-medium text-[#78716C]">
                            {t.occasion}
                          </p>
                        )}
                      </div>

                      {/* Verified Bride pill badge */}
                      <span className="inline-flex items-center gap-1 rounded bg-[#F4ECE4]/80 px-1.5 py-0.5 text-[10px] font-medium text-[#8C2524]">
                        <span>✓</span> Verified Bride
                      </span>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#8C2524] uppercase"
          >
            Read All Reviews <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
