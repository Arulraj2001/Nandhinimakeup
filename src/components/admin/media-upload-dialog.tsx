/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  compressImageToWebP,
  validateImageFile,
  COMPRESSION_PRESETS,
  type CompressionPreset,
} from "@/lib/utils/image-compression";
import { saveMediaRecord, type MediaItem } from "@/lib/actions/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadItem {
  id: string;
  originalFile: File;
  compressedFile?: File;
  previewUrl: string;
  width?: number;
  height?: number;
  originalSize: number;
  compressedSize?: number;
  altText: string;
  fileName: string;
  status: "idle" | "compressing" | "ready" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface MediaUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (uploaded: MediaItem[]) => void;
  defaultPreset?: CompressionPreset;
}

export function MediaUploadDialog({
  open,
  onClose,
  onSuccess,
  defaultPreset = "blog_featured",
}: MediaUploadDialogProps) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [preset, setPreset] = React.useState<CompressionPreset>(defaultPreset);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setIsProcessing(false);
    } else {
      setPreset(defaultPreset);
    }
  }, [open, defaultPreset]);

  const handlePresetChange = async (newPreset: CompressionPreset) => {
    setPreset(newPreset);
    if (items.length === 0) return;

    for (const item of items) {
      if (
        item.status === "error" ||
        item.status === "uploading" ||
        item.status === "done"
      ) {
        continue;
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "compressing" } : it
        )
      );

      try {
        const compressed = await compressImageToWebP(
          item.originalFile,
          newPreset
        );
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  compressedFile: compressed.file,
                  width: compressed.width,
                  height: compressed.height,
                  compressedSize: compressed.compressedSize,
                  status: "ready",
                }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  error:
                    err instanceof Error
                      ? err.message
                      : "Failed to compress image.",
                }
              : it
          )
        );
      }
    }
  };

  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);

      const itemId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      if (!validation.valid) {
        newItems.push({
          id: itemId,
          originalFile: file,
          previewUrl,
          originalSize: file.size,
          altText: "",
          fileName: file.name,
          status: "error",
          progress: 0,
          error: validation.error,
        });
        continue;
      }

      newItems.push({
        id: itemId,
        originalFile: file,
        previewUrl,
        originalSize: file.size,
        altText: "",
        fileName: file.name.replace(/\.[^/.]+$/, ""),
        status: "idle",
        progress: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);

    // Compress valid items using current preset
    for (const item of newItems) {
      if (item.status === "error") continue;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "compressing" } : it
        )
      );

      try {
        const compressed = await compressImageToWebP(
          item.originalFile,
          preset
        );
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  compressedFile: compressed.file,
                  width: compressed.width,
                  height: compressed.height,
                  compressedSize: compressed.compressedSize,
                  status: "ready",
                }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  error:
                    err instanceof Error
                      ? err.message
                      : "Failed to compress image.",
                }
              : it
          )
        );
      }
    }
  };

  const handleSaveAndUpload = async () => {
    // Check if any ready item lacks alt text
    const readyItems = items.filter((it) => it.status === "ready");
    if (readyItems.length === 0) {
      toast.error("No valid images ready to upload.");
      return;
    }

    const missingAlt = readyItems.find((it) => !it.altText.trim());
    if (missingAlt) {
      toast.error(
        `Alt text is required for "${missingAlt.fileName}". Please provide descriptive alt text.`
      );
      return;
    }

    setIsProcessing(true);
    const uploadedMedia: MediaItem[] = [];
    const supabase = createClient();

    for (const item of readyItems) {
      if (!item.compressedFile || !item.width || !item.height) continue;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "uploading", progress: 20 } : it
        )
      );

      const path = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;

      try {
        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from("media")
          .upload(path, item.compressedFile, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });

        if (storageError) {
          throw new Error(storageError.message);
        }

        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, progress: 80 } : it))
        );

        // Save metadata record
        const recordResult = await saveMediaRecord({
          storagePath: path,
          fileName: item.fileName.trim(),
          altText: item.altText.trim(),
          width: item.width,
          height: item.height,
          mimeType: "image/webp",
          sizeBytes: item.compressedSize || item.compressedFile.size,
        });

        if (!recordResult.success) {
          throw new Error(recordResult.error);
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "done", progress: 100 } : it
          )
        );
        uploadedMedia.push(recordResult.data);
      } catch (err) {
        // Cleanup orphan file in storage if metadata save failed
        try {
          await supabase.storage.from("media").remove([path]);
        } catch {
          // Non-blocking cleanup
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  error:
                    err instanceof Error ? err.message : "Failed to upload.",
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);

    if (uploadedMedia.length > 0) {
      toast.success(
        `Successfully uploaded ${uploadedMedia.length} image${uploadedMedia.length > 1 ? "s" : ""}.`
      );
      if (onSuccess) onSuccess(uploadedMedia);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="border-border bg-surface flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4 sm:p-6">
          <div>
            <h2 className="font-heading text-foreground text-xl font-semibold">
              Upload &amp; Optimize Media
            </h2>
            <p className="text-foreground/70 text-xs">
              Automatic conversion to Next-Gen WebP with adaptive lightweight compression.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-foreground/70 hover:text-foreground text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-foreground">
                Optimization Preset:
              </span>
              <span className="text-[11px] text-muted-foreground">
                {COMPRESSION_PRESETS[preset].description}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(COMPRESSION_PRESETS) as CompressionPreset[]).map(
                (key) => {
                  const conf = COMPRESSION_PRESETS[key];
                  const isSelected = preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handlePresetChange(key)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-[#8C2524] bg-[#8C2524]/5 text-[#8C2524] dark:border-[#C9A052] dark:bg-[#C9A052]/10 dark:text-[#E9D4AE]"
                          : "border-border hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold">{conf.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {conf.badge}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* File Dropzone */}
          <div className="border-border bg-page-background hover:bg-surface/30 rounded-lg border-2 border-dashed p-6 text-center">
            <input
              type="file"
              id="media-file-input"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
              disabled={isProcessing}
            />
            <label
              htmlFor="media-file-input"
              className="text-foreground block cursor-pointer text-sm font-medium"
            >
              <span className="font-semibold underline">Click to choose</span>{" "}
              or drag JPEG, PNG, or WebP images here (up to 20 MB)
            </label>
            <p className="text-foreground/70 mt-1 text-xs">
              AI outputs (ChatGPT 3–5 MB) automatically reduced to under 100 KB WebP.
            </p>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider">
                Selected Files ({items.length})
              </h3>

              <div className="divide-border border-border bg-page-background divide-y rounded-lg border">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3">
                    {/* Thumbnail preview */}
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="border-border h-16 w-16 shrink-0 rounded border object-cover"
                    />

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground max-w-[200px] truncate font-medium">
                          {item.originalFile.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-foreground/70 font-mono text-[11px]">
                            {item.originalSize > 1024 * 1024
                              ? `${(item.originalSize / (1024 * 1024)).toFixed(1)} MB`
                              : `${(item.originalSize / 1024).toFixed(0)} KB`}
                            {item.compressedSize &&
                              ` → ${(item.compressedSize / 1024).toFixed(0)} KB WebP`}
                          </span>
                          {item.compressedSize && (
                            <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              ⚡ -{Math.round((1 - item.compressedSize / item.originalSize) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {item.status === "error" && (
                        <p className="text-foreground rounded bg-red-100/50 p-1 font-medium">
                          {item.error}
                        </p>
                      )}

                      {item.status === "compressing" && (
                        <p className="text-foreground/70 flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                          Optimizing image to lightweight WebP...
                        </p>
                      )}

                      {(item.status === "ready" ||
                        item.status === "uploading" ||
                        item.status === "done") && (
                        <div className="space-y-1.5">
                          <div>
                            <Label className="text-[11px]">
                              Alt Text <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={item.altText}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? { ...it, altText: e.target.value }
                                      : it
                                  )
                                )
                              }
                              placeholder="Describe this image for accessibility and SEO"
                              disabled={isProcessing}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {item.status === "uploading" && (
                        <div className="bg-border h-1.5 w-full overflow-hidden rounded">
                          <div
                            className="bg-foreground h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border flex items-center justify-end gap-3 border-t p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndUpload}
            disabled={
              isProcessing ||
              items.filter((it) => it.status === "ready").length === 0
            }
          >
            {isProcessing ? "Uploading..." : "Save to Media Library"}
          </Button>
        </div>
      </div>
    </div>
  );
}
