"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { GalleryItemWithDetails } from "@/types/gallery";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import { getPublicMediaUrl } from "@/lib/utils/media";
import type { LightboxImageItem } from "@/components/public/image-lightbox";

// Lightbox dynamically loaded on first open to keep initial bundle tiny
const ImageLightbox = dynamic(
  () =>
    import("@/components/public/image-lightbox").then(
      (mod) => mod.ImageLightbox
    ),
  { ssr: false }
);

interface GalleryGridProps {
  items: GalleryItemWithDetails[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  // Extract all single image items for lightbox navigation
  const singleImageItems = React.useMemo<LightboxImageItem[]>(() => {
    return items
      .filter((item) => item.type === "single" && item.media)
      .map((item) => ({
        id: item.id,
        src: getPublicMediaUrl(item.media.storage_path),
        alt: item.media.alt_text || item.title || "Gallery photo",
        title: item.title,
        caption: item.caption,
      }));
  }, [items]);

  const handleOpenLightbox = (itemId: string) => {
    const idx = singleImageItems.findIndex((img) => img.id === itemId);
    if (idx !== -1) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          if (item.type === "before_after" && item.before_media && item.media) {
            return (
              <div key={item.id} className="flex flex-col">
                <BeforeAfterSlider
                  beforeImage={{
                    src: getPublicMediaUrl(item.before_media.storage_path),
                    alt:
                      item.before_media.alt_text ||
                      `${item.title || "Look"} - Before`,
                  }}
                  afterImage={{
                    src: getPublicMediaUrl(item.media.storage_path),
                    alt:
                      item.media.alt_text || `${item.title || "Look"} - After`,
                  }}
                  title={item.title}
                  caption={item.caption}
                />
              </div>
            );
          }

          // Single image card
          const imageUrl = item.media
            ? getPublicMediaUrl(item.media.storage_path)
            : null;

          return (
            <article
              key={item.id}
              className="border-border bg-page-background group flex flex-col overflow-hidden rounded-xl border transition-shadow duration-300 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => handleOpenLightbox(item.id)}
                aria-label={`Open ${item.title || "photo"} in lightbox`}
                className="bg-surface focus-visible:ring-foreground relative aspect-[4/5] w-full cursor-pointer overflow-hidden text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={item.media?.alt_text || item.title || "Gallery photo"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
                    No image available
                  </div>
                )}

                {/* Subtle zoom icon hint on hover */}
                <div className="bg-foreground/20 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="bg-page-background/90 text-foreground rounded-full p-2.5 shadow-sm">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </span>
                </div>
              </button>

              {(item.title || item.caption) && (
                <div className="flex flex-1 flex-col p-4">
                  {item.title && (
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {item.title}
                    </h3>
                  )}
                  {item.caption && (
                    <p className="text-foreground/70 mt-1 text-xs leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          items={singleImageItems}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </>
  );
}
