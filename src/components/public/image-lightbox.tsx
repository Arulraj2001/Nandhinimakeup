"use client";

import * as React from "react";
import Image from "next/image";

export interface LightboxImageItem {
  id: string;
  src: string;
  alt: string;
  title?: string | null;
  caption?: string | null;
}

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: LightboxImageItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
}

export function ImageLightbox({
  isOpen,
  onClose,
  items,
  currentIndex,
  onNavigate,
}: ImageLightboxProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Focus restoration & trapping
  React.useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current =
        document.activeElement as HTMLElement | null;
      // Focus close button on mount
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation & trap
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (items.length > 1) {
          onNavigate((currentIndex - 1 + items.length) % items.length);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (items.length > 1) {
          onNavigate((currentIndex + 1) % items.length);
        }
        return;
      }

      // Focus trap for Tab
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements =
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.title || "Image viewer"}
      className="bg-foreground/90 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full w-full max-w-5xl flex-col items-center justify-center"
      >
        {/* Controls Bar */}
        <div className="text-background flex w-full items-center justify-between py-2">
          <div className="text-xs font-medium">
            {currentIndex + 1} / {items.length}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="bg-background/20 text-background hover:bg-background/40 focus-visible:ring-background rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main Image Display */}
        <div className="bg-foreground/30 relative flex aspect-[4/3] max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-lg sm:aspect-[16/10]">
          <Image
            src={currentItem.src}
            alt={currentItem.alt || currentItem.title || "Gallery photo"}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-contain"
            priority
          />

          {/* Previous Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onNavigate((currentIndex - 1 + items.length) % items.length)
              }
              aria-label="Previous image"
              className="bg-foreground/60 text-background hover:bg-foreground/90 focus-visible:ring-background absolute top-1/2 left-3 -translate-y-1/2 rounded-full p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onNavigate((currentIndex + 1) % items.length)}
              aria-label="Next image"
              className="bg-foreground/60 text-background hover:bg-foreground/90 focus-visible:ring-background absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Title and Caption in Lightbox */}
        {(currentItem.title || currentItem.caption) && (
          <div className="text-background mt-3 w-full text-center">
            {currentItem.title && (
              <h2 className="text-base font-semibold">{currentItem.title}</h2>
            )}
            {currentItem.caption && (
              <p className="mt-1 text-xs opacity-80">{currentItem.caption}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
