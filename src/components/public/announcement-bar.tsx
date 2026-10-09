"use client";

import * as React from "react";
import Link from "next/link";
import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Announcement } from "@/types/content";

interface AnnouncementBarProps {
  announcement: Announcement | null;
}

const emptySubscribe = () => () => {};

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const [localDismissed, setLocalDismissed] = React.useState(false);
  const reducedMotion = useReducedMotion();

  const isStorageDismissed = React.useSyncExternalStore(
    emptySubscribe,
    () => {
      if (!announcement) return false;
      try {
        return (
          localStorage.getItem(`dismissed_announcement_${announcement.id}`) ===
          "true"
        );
      } catch {
        return false;
      }
    },
    () => false
  );

  if (!announcement || isStorageDismissed || localDismissed) return null;

  const handleDismiss = () => {
    setLocalDismissed(true);
    try {
      localStorage.setItem(`dismissed_announcement_${announcement.id}`, "true");
    } catch {
      // Storage unavailable
    }
  };

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { y: "-100%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <m.aside
      {...motionProps}
      aria-label="Announcement"
      className="relative w-full border-b border-[#C5A059]/40 bg-gradient-to-r from-[#1C1917] via-[#2A1515] to-[#1C1917] px-4 py-2 text-center text-xs font-medium text-[#FAF8F5] shadow-xs sm:py-2.5 sm:text-[13px]"
    >
      {/* Decorative top gold hairline glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent"
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {/* Subtle gold badge pill */}
          <span className="inline-flex items-center gap-1 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#E8DCC4] uppercase shadow-2xs">
            <span className="h-1 w-1 rounded-full bg-[#C5A059] animate-pulse" />
            <span>Bridal Season</span>
          </span>

          <span className="animate-gold-shimmer font-medium tracking-wide">
            {announcement.message}
          </span>

          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="inline-flex items-center gap-1 rounded-full border border-[#C5A059]/50 bg-gradient-to-r from-[#8C2524] to-[#731E1D] hover:from-[#731E1D] hover:to-[#5E1615] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs transition-all hover:scale-105 active:scale-95 ml-1"
            >
              <span>{announcement.link_label || "Learn more"}</span>
              <span className="text-[10px]">→</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-full text-[#FAF8F5]/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss announcement"
        >
          <span className="text-sm leading-none">✕</span>
        </button>
      </div>
    </m.aside>
  );
}
