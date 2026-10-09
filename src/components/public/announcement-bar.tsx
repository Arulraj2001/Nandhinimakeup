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
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <m.aside
      {...motionProps}
      aria-label="Announcement"
      className="w-full border-b border-[#C5A059]/30 bg-[#1C1917] px-4 py-2 text-center text-xs font-medium text-[#FAF8F5] sm:text-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <span className="animate-gold-shimmer inline-block font-medium">
            {announcement.message}
          </span>
          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="ml-2 font-semibold text-[#C5A059] underline underline-offset-4 transition-colors hover:text-white"
            >
              {announcement.link_label || "Learn more"} →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="cursor-pointer p-1 text-sm font-medium text-[#FAF8F5]/60 hover:text-[#FAF8F5]"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </m.aside>
  );
}
