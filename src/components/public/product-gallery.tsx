"use client";

import * as React from "react";
import Image from "next/image";
import { getPublicMediaUrl } from "@/lib/utils/media";
import type { Database } from "@/types/database";

type MediaRow = Database["public"]["Tables"]["media"]["Row"];

interface ProductGalleryProps {
  images: Array<{
    id: string;
    media: MediaRow;
  }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-surface border-border text-foreground/40 flex aspect-square w-full items-center justify-center rounded-xl border text-sm">
        No images available
      </div>
    );
  }

  const handleSelectThumbnail = (index: number) => {
    setActiveIndex(index);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetChild = container.children[index] as HTMLElement | undefined;
      if (targetChild) {
        container.scrollTo({
          left: targetChild.offsetLeft,
          behavior: "smooth",
        });
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < images.length
      ) {
        setActiveIndex(newIndex);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Swipeable Carousel via CSS Scroll Snap */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="border-border bg-surface flex aspect-square w-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl border focus-visible:outline-none"
        style={{ scrollbarWidth: "none" }}
        tabIndex={0}
        aria-label={`${productName} image gallery swipe area`}
      >
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="relative h-full w-full flex-none snap-center"
          >
            <Image
              src={getPublicMediaUrl(img.media.storage_path)}
              alt={img.media.alt_text || `${productName} image ${idx + 1}`}
              fill
              priority={idx === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Image thumbnails"
        >
          {images.map((img, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Show image ${idx + 1}`}
                onClick={() => handleSelectThumbnail(idx)}
                className={`focus-visible:ring-foreground relative aspect-square h-16 w-16 flex-none cursor-pointer overflow-hidden rounded-md border transition-all focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected
                    ? "border-foreground ring-foreground/20 ring-2"
                    : "border-border hover:opacity-80"
                }`}
              >
                <Image
                  src={getPublicMediaUrl(img.media.storage_path)}
                  alt={img.media.alt_text || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
