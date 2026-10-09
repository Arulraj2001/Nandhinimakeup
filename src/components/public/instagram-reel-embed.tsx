"use client";

import * as React from "react";

interface InstagramReelEmbedProps {
  embedUrl: string;
  url?: string | null;
  title?: string;
  height?: number | string;
  className?: string;
  bare?: boolean;
}

export function InstagramReelEmbed({
  embedUrl,
  url,
  title = "Instagram Reel",
  height = 250,
  className = "",
  bare = false,
}: InstagramReelEmbedProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${
        bare ? "" : "rounded-xl border border-[#E5DFD7] shadow-xs"
      } ${className}`}
      style={{
        minHeight: typeof height === "number" ? `${height}px` : height,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1C1917] via-[#2F1818] to-[#1C1917] p-4 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C5A059] border-t-transparent" />
          <p className="text-[11px] font-medium text-white/70">Loading Instagram Reel...</p>
        </div>
      )}

      <iframe
        src={embedUrl}
        className={`h-full w-full border-0 transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        onLoad={() => setIsLoaded(true)}
        title={title}
      />

      {url && !bare && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/75 px-2.5 py-1 text-[10px] font-medium text-white shadow-xs backdrop-blur-md transition-colors hover:bg-[#8C2524] hover:border-white/40"
        >
          <span>Watch on Instagram</span>
          <span className="text-[9px]">↗</span>
        </a>
      )}
    </div>
  );
}
