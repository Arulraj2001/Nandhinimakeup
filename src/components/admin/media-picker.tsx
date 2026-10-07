/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { getMediaList, type MediaItem } from "@/lib/actions/media";
import { MediaUploadDialog } from "@/components/admin/media-upload-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function getPublicMediaUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`;
}

interface MediaPickerProps {
  open: boolean;
  mode?: "single" | "multiple";
  selectedIds?: string[];
  onClose: () => void;
  onSelect: (selected: MediaItem[]) => void;
}

export function MediaPicker({
  open,
  mode = "single",
  selectedIds = [],
  onClose,
  onSelect,
}: MediaPickerProps) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [selected, setSelected] = React.useState<MediaItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    let active = true;

    void getMediaList({
      search,
      page,
      pageSize: 20,
    }).then((result) => {
      if (!active) return;
      if (result.success) {
        setItems(result.data.items);
        setTotalPages(result.data.totalPages);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, search, page, refreshKey]);

  const toggleSelect = (item: MediaItem) => {
    if (mode === "single") {
      setSelected([item]);
    } else {
      const exists = selected.some((s) => s.id === item.id);
      if (exists) {
        setSelected(selected.filter((s) => s.id !== item.id));
      } else {
        setSelected([...selected, item]);
      }
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      >
        <div className="border-border bg-card-surface flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border shadow-2xl">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b p-4 sm:p-6">
            <div>
              <h2 className="font-heading text-foreground text-xl font-semibold">
                Select Media
              </h2>
              <p className="text-foreground/70 mt-0.5 text-xs">
                {mode === "single"
                  ? "Choose an image from library or upload a new one."
                  : "Choose one or more images from library or upload new ones."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setUploadOpen(true)}
              >
                + Upload New
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-foreground/70 hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="border-border border-b p-4 sm:px-6">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by file name or alt text..."
              className="max-w-md text-sm"
            />
          </div>

          {/* Grid of images */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="text-foreground/70 flex h-64 items-center justify-center text-sm">
                Loading library...
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <p className="text-foreground/80 text-sm">
                  No images found matching your search.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadOpen(true)}
                >
                  Upload Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {items.map((item) => {
                  const isSelected = selected.some((s) => s.id === item.id);
                  const isInitiallySelected = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item)}
                      className={`group relative cursor-pointer overflow-hidden rounded-lg border p-1 transition-all ${
                        isSelected ||
                        (selected.length === 0 && isInitiallySelected)
                          ? "border-foreground bg-foreground/10 ring-foreground ring-2"
                          : "border-border bg-page-background hover:border-foreground/50"
                      }`}
                    >
                      <div className="bg-surface aspect-square overflow-hidden rounded">
                        <img
                          src={getPublicMediaUrl(item.storage_path)}
                          alt={item.alt_text}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-1.5 px-1 pb-1">
                        <p className="text-foreground truncate text-xs font-medium">
                          {item.file_name}
                        </p>
                        <p className="text-foreground/70 text-[10px]">
                          {item.width} × {item.height}
                        </p>
                      </div>

                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="bg-foreground text-background absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with pagination and select button */}
          <div className="border-border flex items-center justify-between border-t p-4 sm:px-6">
            <div className="text-foreground flex items-center gap-2 text-xs">
              <span>Selected: {selected.length}</span>
              {totalPages > 1 && (
                <div className="ml-4 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </Button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={selected.length === 0}
              >
                Confirm Selection ({selected.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog nested */}
      <MediaUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(uploaded) => {
          setRefreshKey((k) => k + 1);
          if (uploaded.length > 0) {
            if (mode === "single") {
              setSelected([uploaded[0]]);
            } else {
              setSelected((prev) => [...prev, ...uploaded]);
            }
          }
        }}
      />
    </>
  );
}
