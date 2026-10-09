"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { GalleryItemWithDetails } from "@/types/gallery";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { resolveInstagramData } from "@/lib/utils/instagram";
import { InstagramReelEmbed } from "@/components/public/instagram-reel-embed";
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
      .filter(
        (
          item
        ): item is GalleryItemWithDetails & {
          media: NonNullable<GalleryItemWithDetails["media"]>;
        } => item.type === "single" && item.media !== null && item.media !== undefined
      )
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {items.map((item) => {
          if (item.type === "before_after" && item.before_media && item.media) {
            return (
              <div key={item.id} className="col-span-2 sm:col-span-1 lg:col-span-2 flex flex-col">
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

          const imageUrl = item.media
            ? getPublicMediaUrl(item.media.storage_path)
            : null;
          const insta = resolveInstagramData(item.instagram_url, item.caption);

          // If no image uploaded, but Instagram link is provided, render Instagram Reel card
          if (!imageUrl && insta.url) {
            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#E5DFD7] bg-white transition-all duration-300 hover:border-[#C5A059] hover:shadow-md"
              >
                {insta.embedUrl ? (
                  <InstagramReelEmbed
                    embedUrl={insta.embedUrl}
                    url={insta.url}
                    title={item.title || "Instagram Look"}
                    height={300}
                    bare={true}
                  />
                ) : (
                  <a
                    href={insta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Watch ${item.title || "bridal look"} on Instagram`}
                    className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1C1917] via-[#2F1818] to-[#1C1917] p-3.5 text-white focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-radial from-[#DD2A7B]/25 via-[#8C2524]/15 to-transparent pointer-events-none"
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        <svg
                          className="h-3 w-3 text-[#E87A5D]"
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
                        <span>Reel</span>
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white text-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#8C2524]">
                        ↗
                      </span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 py-4 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-115 group-hover:bg-[#8C2524]">
                        <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-medium text-white/90 drop-shadow-xs">
                        Watch on Instagram
                      </span>
                    </div>
                    <div className="relative z-10">
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#C5A059] uppercase backdrop-blur-xs">
                        {item.service_category?.name || "Instagram Look"}
                      </span>
                    </div>
                  </a>
                )}

                {/* Footer Metadata */}
                {(item.title || item.caption) && (
                  <div className="flex flex-1 flex-col p-3">
                    {item.title && (
                      <h3 className="font-heading text-sm font-semibold text-[#1C1917] line-clamp-1">
                        {item.title}
                      </h3>
                    )}
                    {item.caption && (
                      <p className="mt-0.5 text-xs text-[#78716C] line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          }

          return (
            <article
              key={item.id}
              className="border-border bg-page-background group flex flex-col overflow-hidden rounded-xl border transition-shadow duration-300 hover:shadow-md"
            >
              <div className="relative">
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
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

                {/* Top Instagram badge if linked */}
                {insta.url && (
                  <div className="pointer-events-auto absolute top-2.5 right-2.5 z-10">
                    <a
                      href={insta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Watch on Instagram"
                      className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs backdrop-blur-md transition-all hover:bg-[#8C2524] hover:border-white/50"
                    >
                      <svg
                        className="h-3 w-3 text-[#E87A5D]"
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
                      <span>{insta.type === "reel" ? "Reel" : "Instagram"}</span>
                      <span className="text-[9px]">↗</span>
                    </a>
                  </div>
                )}
              </div>

              {(item.title || item.caption || insta.url) && (
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
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

                  {insta.url && (
                    <div className="mt-3 pt-2.5 border-t border-[#E5DFD7]/80 flex justify-end">
                      <a
                        href={insta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[#8C2524] uppercase transition-colors hover:text-[#731E1D]"
                      >
                        <span>Watch on Instagram</span>
                        <span>↗</span>
                      </a>
                    </div>
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
