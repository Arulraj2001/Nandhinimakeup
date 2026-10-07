"use client";

import * as React from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeImage: {
    src: string;
    alt: string;
  };
  afterImage: {
    src: string;
    alt: string;
  };
  title?: string | null;
  caption?: string | null;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title,
  caption,
  aspectRatio = "aspect-[4/5]",
  priority = false,
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const accessibleLabel = title
    ? `${title} before and after comparison`
    : "Before and after comparison slider";

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Slider Viewport Container */}
      <div
        className={`group border-border bg-surface focus-within:ring-foreground relative w-full overflow-hidden rounded-xl border select-none focus-within:ring-2 ${aspectRatio}`}
      >
        {/* Layer 1: AFTER Image (Base Layer) */}
        <div className="absolute inset-0 h-full w-full">
          <Image
            src={afterImage.src}
            alt={afterImage.alt || "After treatment"}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        {/* Layer 2: BEFORE Image (Clipped Layer) */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden"
          style={{
            clipPath: `inset(0 calc(100% - ${sliderPosition}%) 0 0)`,
          }}
        >
          <Image
            src={beforeImage.src}
            alt={beforeImage.alt || "Before treatment"}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        {/* Labels */}
        <div className="bg-page-background/80 text-foreground pointer-events-none absolute top-3 left-3 z-10 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase shadow-xs backdrop-blur-xs">
          Before
        </div>
        <div className="bg-page-background/80 text-foreground pointer-events-none absolute top-3 right-3 z-10 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase shadow-xs backdrop-blur-xs">
          After
        </div>

        {/* Visual Divider Line */}
        <div
          className="bg-background pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 -translate-x-1/2 shadow-xs"
          style={{ left: `${sliderPosition}%` }}
        />

        {/* Visual Divider Center Handle */}
        <div
          aria-hidden="true"
          className="border-border bg-page-background text-foreground pointer-events-none absolute top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition-transform duration-100 group-hover:scale-110"
          style={{ left: `${sliderPosition}%` }}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 3 12 9 6" className="hidden" />
            <polyline points="9 18 15 12 9 6" className="hidden" />
            {/* Left and right double arrows */}
            <path d="M8 7l-5 5 5 5" />
            <path d="M16 7l5 5-5 5" />
          </svg>
        </div>

        {/* Native Range Input for Keyboard and Touch / Pointer Operability */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          aria-label={accessibleLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPosition}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0 focus-visible:outline-none"
        />
      </div>

      {/* Caption & Title */}
      {(title || caption) && (
        <div className="mt-3 text-center sm:text-left">
          {title && (
            <h3 className="font-heading text-foreground text-base font-semibold">
              {title}
            </h3>
          )}
          {caption && (
            <p className="text-foreground/70 mt-1 text-xs leading-relaxed">
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
