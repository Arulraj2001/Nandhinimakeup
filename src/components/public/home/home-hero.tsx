"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface HomeHeroProps {
  headline: string;
  supportingText?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  primaryButtonChoice: "services" | "jewellery";
}

function renderColoredHeadline(text: string) {
  if (text.includes("South Indian Brides") && text.includes("Handcrafted Adornments")) {
    return (
      <>
        <span className="block">Crafting Timeless</span>
        <span className="block text-[#8C2524]">South Indian Brides</span>
        <span className="block">
          <span className="font-serif font-normal italic text-[#C5A059]">&amp;</span>{" "}
          <span>Handcrafted Adornments</span>
        </span>
      </>
    );
  }

  if (text.includes("&")) {
    const parts = text.split("&");
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="font-serif font-normal italic text-[#C5A059]">
                {" "}&amp;{" "}
              </span>
            )}
            <span>{part.trim()}</span>
          </React.Fragment>
        ))}
      </>
    );
  }

  return text;
}

export function HomeHero({
  headline,
  supportingText,
  heroImageUrl,
  heroImageAlt,
}: HomeHeroProps) {
  const reducedMotion = useReducedMotion();
  const [btnOffset, setBtnOffset] = React.useState({ x: 0, y: 0 });
  const [isWipeDone, setIsWipeDone] = React.useState(false);

  // Desktop magnetic micro-pull (max 4px)
  const handleBtnMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.12;
    const deltaY = (e.clientY - centerY) * 0.12;
    const clamp = (val: number, max: number) => Math.max(-max, Math.min(max, val));
    setBtnOffset({ x: clamp(deltaX, 4), y: clamp(deltaY, 4) });
  };

  const handleBtnMouseLeave = () => {
    setBtnOffset({ x: 0, y: 0 });
  };

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
          <m.circle
            cx="200"
            cy="200"
            r="180"
            strokeDasharray="3 3"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          />
          <m.circle
            cx="200"
            cy="200"
            r="120"
            strokeWidth="0.5"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          />
          <m.line
            x1="200"
            y1="20"
            x2="200"
            y2="380"
            strokeDasharray="2 4"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          />
          <m.line
            x1="20"
            y1="200"
            x2="380"
            y2="200"
            strokeDasharray="2 4"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          />
          <m.rect
            x="140"
            y="140"
            width="120"
            height="120"
            transform="rotate(45 200 200)"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Hero Editorial Text & Dual Pathways */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Elegant Location & Brand Eyebrow */}
            <m.div
              className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F4ECE4]/80 px-3.5 py-1 text-[11px] font-medium tracking-widest text-[#1C1917] uppercase"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8C2524]" />
              <span>Salem, Tamil Nadu • Bridal Artistry &amp; Jewellery</span>
            </m.div>

            {/* Display Headline with Masked Upward Reveal */}
            <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              <span className="block overflow-hidden pb-1">
                <m.span
                  className="block"
                  initial={reducedMotion ? false : { y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderColoredHeadline(headline)}
                </m.span>
              </span>
            </h1>

            {/* Supporting Editorial Prose */}
            {supportingText && (
              <m.p
                className="mt-5 max-w-2xl text-sm leading-relaxed text-[#57534E] sm:text-base md:text-lg"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                {supportingText}
              </m.p>
            )}

            {/* Two Primary Conversion Pathways */}
            <m.div
              className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:justify-start"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Pathway 1: Bridal Makeup (Kumkum Red Action with magnetic micro-pull & inner glow) */}
              <Link
                href="/services"
                onMouseMove={handleBtnMouseMove}
                onMouseLeave={handleBtnMouseLeave}
                style={{
                  transform:
                    reducedMotion || (btnOffset.x === 0 && btnOffset.y === 0)
                      ? undefined
                      : `translate3d(${btnOffset.x}px, ${btnOffset.y}px, 0)`,
                  transition: "transform 150ms ease-out",
                }}
                className="btn-kumkum-glow group inline-flex h-12 items-center justify-center rounded-md bg-[#8C2524] px-7 text-xs font-semibold tracking-wider text-white uppercase shadow-sm hover:bg-[#731E1D] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <span>Book Bridal Makeup</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              {/* Pathway 2: Jewellery Rental (Antique Gold / Warm Stone Hairline) */}
              <Link
                href="/jewellery"
                className="group inline-flex h-12 items-center justify-center rounded-md border border-[#C5A059] bg-white px-7 text-xs font-semibold tracking-wider text-[#1C1917] uppercase shadow-xs transition-all hover:border-[#8C2524] hover:bg-[#F4ECE4] hover:text-[#8C2524] active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                <span>Explore Jewellery Rental</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </m.div>

            {/* Micro Trust Indicators */}
            <m.div
              className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-[#E5DFD7] pt-5 text-xs text-[#78716C] lg:justify-start"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.54, ease: [0.22, 1, 0.36, 1] }}
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
            </m.div>
          </div>

          {/* Editorial Bridal Image Framing with Clip-path Inset Wipe & Ken Burns Drift */}
          {heroImageUrl && (
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Hairline Antique Gold Offset Border */}
                <m.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 -right-3 h-full w-full rounded-lg border border-[#C5A059]/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Main Portrait Frame with restrained radius and soft clip-path inset wipe */}
                <m.div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[#E5DFD7] bg-white shadow-md"
                  initial={
                    reducedMotion
                      ? false
                      : { clipPath: "inset(0 0 100% 0)", opacity: 0 }
                  }
                  animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  onAnimationComplete={() => setIsWipeDone(true)}
                >
                  <m.div
                    className={`relative h-full w-full ${isWipeDone && !reducedMotion ? "animate-ken-burns" : ""}`}
                    initial={reducedMotion ? false : { scale: 1.08 }}
                    animate={{ scale: 1.0 }}
                    transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Image
                      src={heroImageUrl}
                      alt={heroImageAlt || headline}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 42vw"
                      className="object-cover"
                    />
                  </m.div>

                  {/* Floating Luxury Tag Badge */}
                  <m.div
                    className="absolute right-3 bottom-3 z-10 rounded-md border border-[#C5A059]/40 bg-[#FAF8F5]/90 px-3 py-1.5 shadow-sm backdrop-blur-md"
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-[10px] font-semibold tracking-wider text-[#1C1917] uppercase">
                      Muhurtham HD Makeup &amp; Temple Sets
                    </p>
                    <p className="text-[9px] text-[#78716C]">
                      Salem Studio • By Nandhini
                    </p>
                  </m.div>
                </m.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
