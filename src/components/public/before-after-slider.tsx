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
        className={`group relative w-full overflow-hidden rounded-lg border border-[#E5DFD7] bg-white select-none focus-within:ring-2 focus-within:ring-[#8C2524] ${aspectRatio}`}
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

        {/* Editorial Labels */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-md border border-[#E5DFD7] bg-[#FAF8F5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-[#1C1917] uppercase shadow-xs backdrop-blur-md">
          Before
        </div>
        <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-[#C5A059]/60 bg-[#FAF8F5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-[#8C2524] uppercase shadow-xs backdrop-blur-md">
          After (Muhurtham Glow)
        </div>

        {/* Visual Divider Line in Antique Gold */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-[2px] -translate-x-1/2 bg-[#C5A059] shadow-sm"
          style={{ left: `${sliderPosition}%` }}
        />

        {/* Visual Divider Center Handle in Warm Ivory & Gold */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#C5A059] bg-[#FAF8F5] text-[#8C2524] shadow-md transition-transform duration-100 group-hover:scale-110"
          style={{ left: `${sliderPosition}%` }}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
