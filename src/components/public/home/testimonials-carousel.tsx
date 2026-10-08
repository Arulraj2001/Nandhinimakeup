"use client";

import * as React from "react";
import type { Testimonial } from "@/types/content";

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!testimonials || testimonials.length === 0) return null;

  const handlePrev = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.firstElementChild?.clientWidth || 320;
      container.scrollBy({ left: -(cardWidth + 24), behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.firstElementChild?.clientWidth || 320;
      container.scrollBy({ left: cardWidth + 24, behavior: "smooth" });
    }
  };

  return (
    <section className="border-t border-[#E5DFD7] bg-[#F4ECE4]/40 py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header with Carousel Controls */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-[#8C2524] uppercase">
              ✦ Salem Bride Experiences ✦
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
              Words of Love from Our Brides
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
              Authentic reviews from Muhurtham and Reception ceremonies styled by Nandhini.
            </p>
          </div>

          {/* Previous / Next Controls */}
          {testimonials.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E5DFD7] bg-white text-[#1C1917] shadow-2xs transition-colors hover:border-[#8C2524] hover:bg-[#8C2524] hover:text-white focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E5DFD7] bg-white text-[#1C1917] shadow-2xs transition-colors hover:border-[#8C2524] hover:bg-[#8C2524] hover:text-white focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Carousel Container using CSS Scroll Snap */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Testimonials slider area"
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth rounded-xl pb-4 focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
          style={{ scrollbarWidth: "none" }}
        >
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="w-[85vw] flex-none snap-center sm:w-[380px] md:w-[420px]"
            >
              <article className="flex h-full flex-col justify-between rounded-lg border border-[#E5DFD7] bg-white p-6 shadow-xs transition-all duration-300 hover:border-[#C5A059] hover:shadow-md">
                <div>
                  {/* Decorative Antique Gold Serif Quotation Flourish */}
                  <div
                    aria-hidden="true"
                    className="font-heading -mt-2 -mb-2 select-none text-4xl font-serif text-[#C5A059]/70"
                  >
                    “
                  </div>

                  {/* Gold Star Rating */}
                  <div
                    className="flex items-center gap-1 text-[#C5A059]"
                    aria-label={`Rated ${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-[#C5A059] text-[#C5A059]"
                            : "fill-none text-[#E5DFD7] stroke-current stroke-2"
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="mt-3 text-sm leading-relaxed text-[#57534E] italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Author Info */}
                <div className="mt-6 flex items-center justify-between border-t border-[#E5DFD7] pt-4">
                  <div>
                    <p className="font-heading text-sm font-semibold text-[#1C1917]">
                      {t.customer_name}
                    </p>
                    {t.occasion && (
                      <p className="mt-0.5 text-xs text-[#78716C]">
                        {t.occasion}
                      </p>
                    )}
                  </div>

                  {t.source && (
                    <span className="rounded-full border border-[#E5DFD7] bg-[#FAF8F5] px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-[#78716C] uppercase">
                      {t.source}
                    </span>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
