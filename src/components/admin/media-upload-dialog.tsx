/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  compressImageToWebP,
  validateImageFile,
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
}

export function MediaUploadDialog({
  open,
  onClose,
  onSuccess,
}: MediaUploadDialogProps) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setItems([]);
      setIsProcessing(false);
    }
  }, [open]);

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

    // Compress valid items
    for (const item of newItems) {
      if (item.status === "error") continue;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "compressing" } : it
        )
      );

      try {
        const compressed = await compressImageToWebP(item.originalFile);
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
      <div className="border-border bg-surface flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4 sm:p-6">
          <h2 className="font-heading text-foreground text-xl font-semibold">
            Upload Media
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-foreground/70 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
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
              or drag JPEG, PNG, or WebP images here (up to 15 MB)
            </label>
            <p className="text-foreground/70 mt-1 text-xs">
              Images are automatically optimized and converted to WebP (max
              2000px).
            </p>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold">
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
                      <div className="flex items-center justify-between">
                        <span className="text-foreground max-w-[200px] truncate font-medium">
                          {item.originalFile.name}
                        </span>
                        <span className="text-foreground/70">
                          {(item.originalSize / 1024).toFixed(0)} KB
                          {item.compressedSize &&
                            ` → ${(item.compressedSize / 1024).toFixed(0)} KB WebP`}
                        </span>
                      </div>

                      {item.status === "error" && (
                        <p className="text-foreground rounded bg-red-100/50 p-1 font-medium">
                          {item.error}
                        </p>
                      )}

                      {item.status === "compressing" && (
                        <p className="text-foreground/70">
                          Optimizing image...
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
                              placeholder="Describe this image for accessibility"
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
