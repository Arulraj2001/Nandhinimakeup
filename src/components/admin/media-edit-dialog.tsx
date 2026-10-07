"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateMediaRecord, type MediaItem } from "@/lib/actions/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MediaEditDialogProps {
  open: boolean;
  item: MediaItem | null;
  onClose: () => void;
  onSuccess: (updated: MediaItem) => void;
}

function MediaEditForm({
  item,
  onClose,
  onSuccess,
}: {
  item: MediaItem;
  onClose: () => void;
  onSuccess: (updated: MediaItem) => void;
}) {
  const [fileName, setFileName] = React.useState(item.file_name);
  const [altText, setAltText] = React.useState(item.alt_text);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      toast.error("File name cannot be empty.");
      return;
    }
    if (!altText.trim()) {
      toast.error("Alt text is required for accessibility.");
      return;
    }

    setIsLoading(true);
    const result = await updateMediaRecord({
      id: item.id,
      fileName: fileName.trim(),
      altText: altText.trim(),
    });

    setIsLoading(false);

    if (result.success) {
      toast.success("Media details updated successfully.");
      onSuccess(result.data);
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="border-border bg-card-surface w-full max-w-md rounded-xl border p-6 shadow-xl">
      <h2 className="font-heading text-foreground text-xl font-semibold">
        Edit Media Details
      </h2>
      <p className="text-foreground/70 mt-1 text-xs">
        Update file name and alt text. File content cannot be replaced.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-media-filename">File Name</Label>
          <Input
            id="edit-media-filename"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-media-alttext">Alt Text (Required)</Label>
          <Input
            id="edit-media-alttext"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            disabled={isLoading}
            placeholder="Descriptive text for accessibility"
            required
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function MediaEditDialog({
  open,
  item,
  onClose,
  onSuccess,
}: MediaEditDialogProps) {
  if (!open || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <MediaEditForm
        key={item.id}
        item={item}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}
