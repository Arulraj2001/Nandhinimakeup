"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface HomeHeroProps {
  headline: string;
  supportingText?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  primaryButtonChoice: "services" | "jewellery";
}

export function HomeHero({
  headline,
  supportingText,
  heroImageUrl,
  heroImageAlt,
  primaryButtonChoice,
}: HomeHeroProps) {
  const reducedMotion = useReducedMotion();
  const isServicesPrimary = primaryButtonChoice === "services";

  return (
    <section className="relative overflow-hidden border-b border-[#E5DFD7] bg-[#FAF8F5] py-12 sm:py-16 md:py-20 lg:py-24">
      {/* Subtle editorial craft accent lines (restrained Kolam-inspired hairlines) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
      >
        <svg
          className="text-[#C5A059]/30 absolute top-0 right-0 h-96 w-96 -translate-y-12 translate-x-12"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
        >
          <circle cx="200" cy="200" r="180" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="120" strokeWidth="0.5" />
          <line x1="200" y1="20" x2="200" y2="380" strokeDasharray="2 4" />
          <line x1="20" y1="200" x2="380" y2="200" strokeDasharray="2 4" />
          <rect x="140" y="140" width="120" height="120" transform="rotate(45 200 200)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Hero Editorial Text & Dual Pathways */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Elegant Location & Brand Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F4ECE4]/80 px-3.5 py-1 text-[11px] font-medium tracking-widest text-[#1C1917] uppercase"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.5s ease-out both",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8C2524]" />
              <span>Salem, Tamil Nadu • Bridal Artistry &amp; Jewellery</span>
            </div>

            {/* Display Headline */}
            <h1
              className="font-heading mt-4 text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.55s ease-out 0.1s both",
              }}
            >
              {headline}
            </h1>

            {/* Supporting Editorial Prose */}
            {supportingText && (
              <p
                className="mt-5 max-w-2xl text-sm leading-relaxed text-[#57534E] sm:text-base md:text-lg"
                style={{
                  animation: reducedMotion
                    ? "none"
                    : "fadeInUp 0.6s ease-out 0.2s both",
                }}
              >
                {supportingText}
              </p>
            )}

            {/* Two Primary Conversion Pathways */}
            <div
              className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:justify-start"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.65s ease-out 0.3s both",
              }}
            >
              {/* Pathway 1: Bridal Makeup (Kumkum Red Action) */}
              <Link
                href="/services"
                className="group inline-flex h-12 items-center justify-center rounded-md bg-[#8C2524] px-7 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-[#731E1D] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <span>Book Bridal Makeup</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              {/* Pathway 2: Jewellery Rental (Antique Gold / Warm Stone Hairline) */}
              <Link
                href="/jewellery"
                className="group inline-flex h-12 items-center justify-center rounded-md border border-[#C5A059] bg-white px-7 text-xs font-semibold tracking-wider text-[#1C1917] uppercase shadow-xs transition-all hover:border-[#8C2524] hover:bg-[#F4ECE4] hover:text-[#8C2524] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <span>Explore Jewellery Rental</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            {/* Micro Trust Indicators */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-[#E5DFD7] pt-5 text-xs text-[#78716C] lg:justify-start"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.7s ease-out 0.35s both",
              }}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#C5A059]">✦</span>
                <span>HD &amp; Glossy Bridal Finishes</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#C5A059]">✦</span>
                <span>Authentic Temple, Nagas &amp; AD Sets</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#C5A059]">✦</span>
                <span>Studio &amp; On-Venue Travel</span>
              </div>
            </div>
          </div>

          {/* Editorial Bridal Image Framing */}
          {heroImageUrl && (
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Hairline Antique Gold Offset Border */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 -right-3 h-full w-full rounded-lg border border-[#C5A059]/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"
                />

                {/* Main Portrait Frame with restrained radius */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[#E5DFD7] bg-white shadow-md">
                  <Image
                    src={heroImageUrl}
                    alt={heroImageAlt || headline}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 42vw"
                    className="object-cover transition-transform duration-700 hover:scale-102"
                  />

                  {/* Floating Luxury Tag Badge */}
                  <div className="absolute right-3 bottom-3 z-10 rounded-md border border-[#C5A059]/40 bg-[#FAF8F5]/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
                    <p className="text-[10px] font-semibold tracking-wider text-[#1C1917] uppercase">
                      Muhurtham HD Makeup &amp; Temple Sets
                    </p>
                    <p className="text-[9px] text-[#78716C]">
                      Salem Studio • By Nandhini
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
