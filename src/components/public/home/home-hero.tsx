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
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });

  // Gentle desktop parallax on background floating shapes only
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion) return;
    // Only apply on desktop viewports
    if (window.innerWidth < 1024) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20;
    const y = (clientY / innerHeight - 0.5) * 20;
    setMouseOffset({ x, y });
  };

  const isServicesPrimary = primaryButtonChoice === "services";

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24"
    >
      {/* Decorative floating shapes in palette colours with gentle parallax on desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Floating shape 1 - Soft circle */}
        <div
          className="bg-accent/20 absolute -top-12 -left-12 h-64 w-64 rounded-full blur-3xl transition-transform duration-300 ease-out will-change-transform lg:h-96 lg:w-96"
          style={{
            transform: reducedMotion
              ? "none"
              : `translate3d(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px, 0)`,
          }}
        />

        {/* Floating shape 2 - Soft petal/oval in accent */}
        <div
          className="bg-surface absolute top-1/3 right-4 h-72 w-72 rounded-full blur-2xl transition-transform duration-300 ease-out will-change-transform lg:h-80 lg:w-80"
          style={{
            transform: reducedMotion
              ? "none"
              : `translate3d(${mouseOffset.x * -1}px, ${mouseOffset.y * -1}px, 0)`,
          }}
        />

        {/* Decorative inline SVG ornaments in palette colours */}
        <svg
          className="text-accent/40 absolute top-16 right-12 hidden h-24 w-24 transition-transform duration-300 ease-out lg:block"
          style={{
            transform: reducedMotion
              ? "none"
              : `translate3d(${mouseOffset.x * 1.2}px, ${mouseOffset.y * 1.2}px, 0)`,
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path d="M50 10 C 65 35, 65 65, 50 90" strokeWidth="1" />
          <path d="M50 10 C 35 35, 35 65, 50 90" strokeWidth="1" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>

        <svg
          className="text-accent/30 absolute bottom-12 left-1/4 hidden h-20 w-20 transition-transform duration-300 ease-out lg:block"
          style={{
            transform: reducedMotion
              ? "none"
              : `translate3d(${mouseOffset.x * -0.6}px, ${mouseOffset.y * -0.6}px, 0)`,
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
        >
          <polygon points="50,15 85,80 15,80" strokeWidth="1" />
          <circle cx="50" cy="50" r="2" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Hero Text & Entry Buttons */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            <span
              className="text-foreground/70 mb-3 inline-block text-xs font-semibold tracking-widest uppercase"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.4s ease-out both",
              }}
            >
              Artistry & Curated Ornaments
            </span>

            <h1
              className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.5s ease-out 0.1s both",
              }}
            >
              {headline}
            </h1>

            {supportingText && (
              <p
                className="text-foreground/80 mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
                style={{
                  animation: reducedMotion
                    ? "none"
                    : "fadeInUp 0.5s ease-out 0.2s both",
                }}
              >
                {supportingText}
              </p>
            )}

            {/* Two Entry Buttons: Primary & Secondary */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "fadeInUp 0.5s ease-out 0.3s both",
              }}
            >
              {/* Primary button: foreground fill with background-colour text */}
              {isServicesPrimary ? (
                <Link
                  href="/services"
                  className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Book Makeup
                </Link>
              ) : (
                <Link
                  href="/jewellery"
                  className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Shop Jewellery
                </Link>
              )}

              {/* Secondary button: accent fill with foreground text */}
              {isServicesPrimary ? (
                <Link
                  href="/jewellery"
                  className="bg-accent text-foreground hover:bg-accent/80 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Shop Jewellery
                </Link>
              ) : (
                <Link
                  href="/services"
                  className="bg-accent text-foreground hover:bg-accent/80 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Book Makeup
                </Link>
              )}
            </div>
          </div>

          {/* Hero Image as the single LCP element */}
          {heroImageUrl && (
            <div className="flex justify-center lg:col-span-5">
              <div className="border-border bg-surface relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border shadow-lg">
                <Image
                  src={heroImageUrl}
                  alt={heroImageAlt || headline}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
