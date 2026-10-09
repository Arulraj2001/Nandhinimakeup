"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItemWithDetails } from "@/types/gallery";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { resolveInstagramData } from "@/lib/utils/instagram";

interface RecentWorksInstagramProps {
  items: GalleryItemWithDetails[];
  instagramUrl?: string;
  instagramHandle?: string;
}

export function RecentWorksInstagram({
  items,
  instagramUrl = "https://www.instagram.com/nandhini__makeupartist/",
  instagramHandle = "@nandhini__makeupartist",
}: RecentWorksInstagramProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  // Duplicate for smooth seamless loop
  const displayItems =
    items.length < 5
      ? [...items, ...items, ...items, ...items]
      : [...items, ...items];

  const handlePrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-[#E5DFD7] bg-bridal-grid-crimson py-16 sm:py-20 md:py-24">
      {/* Ambient glow lights */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-[#8C2524]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-[#C5A059]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
              <p className="text-xs font-semibold tracking-widest text-[#8C2524] uppercase">
                ✦ Fresh From Our Studio ✦
              </p>
            </div>
            <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
              Recent Works
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#57534E] sm:text-base">
              Real Muhurtham ceremonies, bespoke hair artistry, and HD glass-skin
              transformations recorded live at{" "}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#8C2524] underline underline-offset-2 transition-colors hover:text-[#731E1D]"
              >
                {instagramHandle}
              </a>
              .
            </p>
          </div>

          {/* Action links & Carousel Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DD2A7B]/30 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1917] shadow-2xs transition-all hover:border-[#DD2A7B] hover:shadow-xs"
            >
              {/* Instagram Icon */}
              <svg
                className="h-3.5 w-3.5 text-[#DD2A7B]"
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
              <span>Follow on Instagram</span>
              <span className="text-[10px] text-[#DD2A7B]">↗</span>
            </a>

            <Link
              href="/gallery"
              className="hidden items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D] md:inline-flex"
            >
              Full Gallery <span>→</span>
            </Link>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous work"
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
                aria-label="Next work"
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

        {/* Moving Animation Cards Track: Continuous auto-glide */}
        <div className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {/* Subtle lateral gradient fades */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#FAF6F3] to-transparent sm:w-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#FAF6F3] to-transparent sm:w-20"
          />

          <div
            ref={scrollContainerRef}
            className="animate-marquee-slow flex items-stretch gap-5 py-4"
          >
            {displayItems.map((item, idx) => {
              const img = item.media;
              if (!img && !item.instagram_url) return null;

              const insta = resolveInstagramData(
                item.instagram_url,
                item.caption
              );
              const targetUrl = insta.url || instagramUrl;
              const isExternal = Boolean(insta.url || targetUrl);

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-[240px] flex-none sm:w-[270px] md:w-[290px]"
                >
                  <a
                    href={targetUrl}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="group relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-2xl border border-[#E5DFD7] bg-white shadow-xs transition-all duration-500 hover:border-[#C5A059] hover:shadow-xl hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                  >
                    {/* Background: Either local media image OR rich Instagram Reel poster styling */}
                    {img ? (
                      <>
                        <Image
                          src={getPublicMediaUrl(img.storage_path)}
                          alt={img.alt_text || item.title || "Bridal look"}
                          fill
                          sizes="(max-width: 640px) 240px, 290px"
                          className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-108"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/90 via-[#1C1917]/25 to-black/30 transition-opacity duration-300 group-hover:opacity-95"
                        />
                      </>
                    ) : insta.embedUrl ? (
                      <div className="absolute inset-0 z-0 bg-black">
                        <iframe
                          src={insta.embedUrl}
                          className="h-full w-full border-0 pointer-events-auto"
                          loading="lazy"
                          scrolling="no"
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                          title={item.title || "Instagram Look"}
                        />
                      </div>
                    ) : (
                      <>
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-br from-[#8C2524] via-[#5C1615] to-[#1C1917] transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-25"
                          style={{
                            backgroundImage: `radial-gradient(circle at 50% 35%, rgba(197, 160, 89, 0.4) 0%, transparent 60%)`,
                          }}
                        />
                      </>
                    )}

                    {/* Bottom Metadata & Hover Reveal - Pinned to Bottom */}
                    <div className="relative z-10 mt-auto w-full p-4 bg-gradient-to-t from-black/90 via-black/45 to-transparent">
                      {item.service_category?.name && (
                        <p className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase">
                          {item.service_category.name}
                        </p>
                      )}

                      <h3 className="font-heading mt-0.5 text-base font-semibold leading-snug text-white drop-shadow-xs line-clamp-1">
                        {item.title || "Bridal Artistry"}
                      </h3>

                      {item.caption && (
                        <p className="mt-1 text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {item.caption}
                        </p>
                      )}

                      {/* Direct action button banner on hover */}
                      <div className="mt-2.5 flex items-center justify-between rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur-md transition-all duration-300 group-hover:bg-[#8C2524] group-hover:border-[#8C2524]">
                        <span className="text-[11px] font-medium tracking-wide text-white">
                          Watch on Instagram
                        </span>
                        <span className="text-xs text-white">→</span>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA for Mobile */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-center sm:hidden">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8C2524] uppercase"
          >
            <span>Follow on Instagram</span>
            <span>↗</span>
          </a>
          <span className="text-[#E5DFD7]">•</span>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#57534E] uppercase"
          >
            <span>View Full Gallery</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
