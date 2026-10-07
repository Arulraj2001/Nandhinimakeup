"use client";

import * as React from "react";
import Link from "next/link";
import type { Announcement } from "@/types/content";

interface AnnouncementBarProps {
  announcement: Announcement | null;
}

const emptySubscribe = () => () => {};

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const [localDismissed, setLocalDismissed] = React.useState(false);

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

  return (
    <aside
      aria-label="Announcement"
      className="bg-accent text-foreground border-foreground/10 relative z-30 border-b px-4 py-2 text-center text-xs font-medium sm:text-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <span>{announcement.message}</span>
          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="ml-2 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {announcement.link_label || "Learn more"} →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-foreground/70 hover:text-foreground cursor-pointer p-1 text-sm font-bold"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
