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
  if (
    text.includes("South Indian Brides") &&
    text.includes("Handcrafted Adornments")
  ) {
    return (
      <>
        <span className="block">Crafting Timeless</span>
        <span className="block text-[#8C2524]">South Indian Brides</span>
        <span className="block">
          <span className="font-serif font-normal italic text-[#C5A059]">
            &amp;
          </span>{" "}
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
                {" "}
                &amp;{" "}
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
    const clamp = (val: number, max: number) =>
      Math.max(-max, Math.min(max, val));
    setBtnOffset({ x: clamp(deltaX, 4), y: clamp(deltaY, 4) });
  };

  const handleBtnMouseLeave = () => {
    setBtnOffset({ x: 0, y: 0 });
  };

  return (
    <section className="relative overflow-hidden border-b border-[#E5DFD7] bg-[#FAF8F5] py-12 sm:py-16 md:py-20 lg:py-24">
      {/* 1. Dramatic Top-Left Splitting Spotlight Rays (Studio Lighting Beams) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden"
      >
        {/* Luminous Light Source Glow at the Top-Left Apex */}
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-br from-white via-[#FFF2D6]/80 to-transparent blur-3xl opacity-90" />

        {/* Splitting Radiant Beams spreading from (0,0) across the headline */}
        <m.svg
          className="absolute top-0 left-0 h-[680px] w-full max-w-5xl"
          viewBox="0 0 1000 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={
            reducedMotion
              ? false
              : {
                  opacity: [0.65, 0.9, 0.65],
                }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <defs>
            {/* Soft Warm Gold Beam Gradient 1 */}
            <linearGradient
              id="spotlightRay1"
              x1="0"
              y1="0"
              x2="500"
              y2="680"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="25%" stopColor="#C5A059" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#E8DCC4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>

            {/* Bright Center Beam Gradient 2 */}
            <linearGradient
              id="spotlightRay2"
              x1="0"
              y1="0"
              x2="780"
              y2="600"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <stop offset="20%" stopColor="#FFF4DC" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#C5A059" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>

            {/* Wide Ambient Beam Gradient 3 */}
            <linearGradient
              id="spotlightRay3"
              x1="0"
              y1="0"
              x2="950"
              y2="420"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#C5A059" stopOpacity="0.16" />
              <stop offset="80%" stopColor="#C5A059" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
            </linearGradient>

            <filter
              id="spotlightFeather"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>

          {/* Splitting Ray A: Steep downward fan */}
          <polygon
            points="0,0 120,680 260,680"
            fill="url(#spotlightRay1)"
            filter="url(#spotlightFeather)"
          />

          {/* Splitting Ray B: Main radiant beam shooting toward CTAs */}
          <polygon
            points="0,0 340,680 520,680"
            fill="url(#spotlightRay2)"
            filter="url(#spotlightFeather)"
          />

          {/* Splitting Ray C: Angled beam crossing the headline */}
          <polygon
            points="0,0 600,680 780,620"
            fill="url(#spotlightRay1)"
            opacity="0.85"
            filter="url(#spotlightFeather)"
          />

          {/* Splitting Ray D: Upper beam illuminating toward the bridal portrait */}
          <polygon
            points="0,0 820,520 980,420"
            fill="url(#spotlightRay3)"
            opacity="0.75"
            filter="url(#spotlightFeather)"
          />

          {/* Splitting Ray E: High wide horizon wash */}
          <polygon
            points="0,0 1000,340 1000,180"
            fill="url(#spotlightRay2)"
            opacity="0.55"
            filter="url(#spotlightFeather)"
          />
        </m.svg>
      </div>

      {/* 2. Luxury subtle editorial gold grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 bg-[linear-gradient(to_right,rgba(197,160,89,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(197,160,89,0.08)_1px,transparent_1px)] bg-[size:36px_36px]"
      />

      {/* 3. Ambient Floating Champagne Gold Light Glow (Top Right) */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-4 sm:right-1/4 h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-gradient-to-br from-[#C5A059]/20 via-[#E8DCC4]/30 to-transparent blur-3xl z-0"
        animate={
          reducedMotion
            ? false
            : {
                scale: [1, 1.15, 1],
                x: [0, 20, 0],
                y: [0, -15, 0],
                opacity: [0.45, 0.8, 0.45],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 4. Ambient Floating Bridal Kumkum Rose Glow (Bottom Left) */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-4 sm:left-12 h-72 w-72 sm:h-80 sm:w-80 rounded-full bg-gradient-to-tr from-[#8C2524]/12 via-[#C5A059]/10 to-transparent blur-3xl z-0"
        animate={
          reducedMotion
            ? false
            : {
                scale: [1, 1.2, 1],
                x: [0, -15, 0],
                y: [0, 15, 0],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 5. Floating Heritage Gold Sparkles (✦) */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute top-14 left-[8%] z-0 select-none text-base text-[#C5A059]"
        animate={
          reducedMotion
            ? false
            : {
                y: [-8, 8, -8],
                rotate: [0, 15, -15, 0],
                opacity: [0.35, 0.9, 0.35],
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        ✦
      </m.div>
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-[8%] z-0 select-none text-base text-[#C5A059]"
        animate={
          reducedMotion
            ? false
            : {
                y: [-9, 9, -9],
                rotate: [0, -20, 20, 0],
                opacity: [0.3, 0.85, 0.3],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        ✦
      </m.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Hero Editorial Text & Dual Pathways */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Elegant Location & Brand Eyebrow with Pulsing Auspicious Pip */}
            <m.div
              className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F4ECE4]/90 px-3.5 py-1 text-[11px] font-medium tracking-widest text-[#1C1917] uppercase shadow-2xs backdrop-blur-xs"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C2524] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C2524]" />
              </span>
              <span>Salem, Tamil Nadu • Bridal Artistry &amp; Jewellery</span>
            </m.div>

            {/* Display Headline with Masked Upward Reveal */}
            <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              <span className="block overflow-hidden pb-1">
                <m.span
                  className="block"
                  initial={reducedMotion ? false : { y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
                transition={{
                  duration: 0.6,
                  delay: 0.34,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {supportingText}
              </m.p>
            )}

            {/* Two Primary Conversion Pathways */}
            <m.div
              className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:justify-start"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.44,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                className="group inline-flex h-12 items-center justify-center rounded-md border border-[#C5A059] bg-white px-7 text-xs font-semibold tracking-wider text-[#1C1917] uppercase shadow-2xs transition-all hover:border-[#8C2524] hover:bg-[#F4ECE4] hover:text-[#8C2524] active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
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
              transition={{
                duration: 0.6,
                delay: 0.54,
                ease: [0.22, 1, 0.36, 1],
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
            </m.div>
          </div>

          {/* Editorial Bridal Image Framing with Prabhavali Temple Arch & Subtle Ambient Aura */}
          {heroImageUrl && (
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Royal South Indian Temple Prabhavali Arch & Warm Halo behind the portrait */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-6 -z-10 flex items-center justify-center overflow-visible"
                >
                  {/* Warm Golden Halo Aura (Breathing Light Glow, NOT spinning) */}
                  <m.div
                    className="absolute h-full w-full max-h-[520px] max-w-[430px] rounded-full bg-gradient-to-b from-[#C5A059]/20 via-[#FAF0DB]/25 to-transparent blur-2xl"
                    animate={
                      reducedMotion
                        ? false
                        : {
                            scale: [0.98, 1.05, 0.98],
                            opacity: [0.45, 0.7, 0.45],
                          }
                    }
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Authentic South Indian Temple Arch (Prabhavali) Silhouette */}
                  <svg
                    className="h-[108%] w-[108%] text-[#C5A059]"
                    viewBox="0 0 460 520"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="archGoldGrad"
                        x1="230"
                        y1="20"
                        x2="230"
                        y2="500"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor="#C5A059" stopOpacity="0.55" />
                        <stop offset="60%" stopColor="#C5A059" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#E5DFD7" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Outer Classical Arch */}
                    <path
                      d="M 50 500 L 50 210 C 50 100, 410 100, 410 210 L 410 500"
                      stroke="url(#archGoldGrad)"
                      strokeWidth="1.25"
                      strokeDasharray="4 4"
                    />

                    {/* Inner Scalloped Temple Arch */}
                    <path
                      d="M 75 500 L 75 220 C 75 125, 385 125, 385 220 L 385 500"
                      stroke="url(#archGoldGrad)"
                      strokeWidth="1"
                    />

                    {/* Sacred Lotus / Kalasam Finial at Top Crown */}
                    <path
                      d="M 230 40 Q 215 75, 230 95 Q 245 75, 230 40 Z"
                      fill="#C5A059"
                      fillOpacity="0.2"
                      stroke="#C5A059"
                      strokeWidth="1"
                    />
                    <path
                      d="M 230 95 Q 200 80, 190 60 Q 210 90, 230 95 Z"
                      fill="#C5A059"
                      fillOpacity="0.15"
                      stroke="#C5A059"
                      strokeWidth="0.75"
                    />
                    <path
                      d="M 230 95 Q 260 80, 270 60 Q 250 90, 230 95 Z"
                      fill="#C5A059"
                      fillOpacity="0.15"
                      stroke="#C5A059"
                      strokeWidth="0.75"
                    />
                    <circle cx="230" cy="35" r="3" fill="#8C2524" />

                    {/* Traditional Kasu / Bead Strand along Arch Curve */}
                    <path
                      d="M 100 230 C 100 150, 360 150, 360 230"
                      stroke="#C5A059"
                      strokeWidth="0.75"
                      strokeDasharray="2 6"
                      strokeLinecap="round"
                    />

                    {/* Auspicious Side Toranam Floral Accents */}
                    <circle
                      cx="50"
                      cy="210"
                      r="4"
                      fill="#C5A059"
                      fillOpacity="0.3"
                      stroke="#C5A059"
                    />
                    <circle
                      cx="410"
                      cy="210"
                      r="4"
                      fill="#C5A059"
                      fillOpacity="0.3"
                      stroke="#C5A059"
                    />
                  </svg>
                </div>

                {/* Hairline Antique Gold Offset Border */}
                <m.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 -right-3 h-full w-full rounded-lg border border-[#C5A059]/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />

                {/* Floating Element 1: Top-Left Floating Trust Badge (Overlapping portrait) */}
                <m.div
                  className="absolute -top-4 -left-3 sm:-left-6 z-20 rounded-xl border border-[#C5A059]/50 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md"
                  initial={
                    reducedMotion ? false : { opacity: 0, scale: 0.9, y: 10 }
                  }
                  animate={
                    reducedMotion
                      ? { opacity: 1, scale: 1 }
                      : {
                          opacity: 1,
                          scale: 1,
                          y: [-4, 4, -4],
                        }
                  }
                  transition={{
                    y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                    duration: 0.6,
                    delay: 0.75,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C2524] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C2524]" />
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#1C1917]">
                      <span className="text-[#C5A059]">★ 5.0</span>
                      <span>(400+ Brides Styled)</span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-[9px] font-medium tracking-wider text-[#78716C] uppercase">
                    Salem • Muhurtham Specialist
                  </p>
                </m.div>

                {/* Main Portrait Frame (with reduced height: aspect-[8/9]) */}
                <m.div
                  className="relative aspect-[8/9] w-full overflow-hidden rounded-lg border border-[#E5DFD7] bg-white shadow-md"
                  initial={
                    reducedMotion
                      ? false
                      : { clipPath: "inset(0 0 100% 0)", opacity: 0 }
                  }
                  animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onAnimationComplete={() => setIsWipeDone(true)}
                >
                  <m.div
                    className={`relative h-full w-full ${isWipeDone && !reducedMotion ? "animate-ken-burns" : ""}`}
                    initial={reducedMotion ? false : { scale: 1.08 }}
                    animate={{ scale: 1.0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
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

                  {/* Floating Element 2: Bottom-Right Floating Luxury Tag Badge */}
                  <m.div
                    className="absolute right-3 bottom-3 z-10 rounded-lg border border-[#C5A059]/50 bg-[#FAF8F5]/95 px-3.5 py-2 shadow-md backdrop-blur-md"
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={
                      reducedMotion
                        ? { opacity: 1, y: 0 }
                        : {
                            opacity: 1,
                            y: [0, -5, 0],
                          }
                    }
                    transition={{
                      y: {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      },
                      duration: 0.5,
                      delay: 0.85,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#C5A059]">✦</span>
                      <p className="text-[10px] font-semibold tracking-wider text-[#1C1917] uppercase">
                        Muhurtham HD Makeup &amp; Temple Sets
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-4 text-[9px] text-[#78716C]">
                      <span>Salem Studio • By Nandhini</span>
                      <span className="font-semibold text-[#8C2524]">
                        From ₹5,999
                      </span>
                    </div>
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
