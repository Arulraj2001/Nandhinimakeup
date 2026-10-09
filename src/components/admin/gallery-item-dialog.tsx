/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  saveGalleryItem,
  type GalleryItemWithDetails,
} from "@/lib/actions/gallery";
import {
  saveGalleryItemSchema,
  type SaveGalleryItemInput,
} from "@/types/gallery";
import type { ServiceCategory } from "@/types/services";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import {
  MediaPicker,
  getPublicMediaUrl,
} from "@/components/admin/media-picker";
import type { MediaItem } from "@/lib/actions/media";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GalleryItemDialogProps {
  open: boolean;
  item: GalleryItemWithDetails | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

export function GalleryItemDialog({
  open,
  item,
  categories,
  onClose,
  onSuccess,
}: GalleryItemDialogProps) {
  if (!open) return null;

  return (
    <GalleryItemDialogInner
      key={item?.id || "new"}
      item={item}
      categories={categories}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function GalleryItemDialogInner({
  item,
  categories,
  onClose,
  onSuccess,
}: {
  item: GalleryItemWithDetails | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(item);
  const [pickerTarget, setPickerTarget] = React.useState<
    "media" | "before_media" | null
  >(null);

  const [mainMedia, setMainMedia] = React.useState<MediaItem | null>(
    (item?.media as MediaItem) || null
  );
  const [beforeMedia, setBeforeMedia] = React.useState<MediaItem | null>(
    (item?.before_media as MediaItem) || null
  );

  const form = useForm<SaveGalleryItemInput>({
    resolver: zodResolver(saveGalleryItemSchema),
    defaultValues: {
      id: item?.id,
      type: item?.type || "single",
      media_id: item?.media_id || "",
      before_media_id: item?.before_media_id || null,
      title: item?.title || "",
      caption: item?.caption || "",
      service_category_id: item?.service_category_id || null,
      instagram_url: item?.instagram_url || "",
      is_featured: item?.is_featured ?? false,
      is_published: item?.is_published ?? true,
      sort_order: item?.sort_order ?? 0,
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const currentType = form.watch("type");
  const mediaId = form.watch("media_id");
  const beforeMediaId = form.watch("before_media_id");

  const onSubmit = async (values: SaveGalleryItemInput) => {
    const res = await saveGalleryItem(values);

    if (!res.success) {
      toast.error(res.error || "Failed to save gallery item");
      if (res.fieldErrors) {
        Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
          if (msgs && msgs[0]) {
            form.setError(field as keyof SaveGalleryItemInput, {
              message: msgs[0],
            });
          }
        });
      }
      return;
    }

    toast.success(
      isEditing
        ? "Gallery item updated successfully."
        : "Gallery item created successfully."
    );
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-dialog-title"
    >
      <div className="border-border bg-surface text-foreground my-8 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2
              id="gallery-dialog-title"
              className="font-heading text-foreground text-xl font-semibold"
            >
              {isEditing ? "Edit Gallery Item" : "New Gallery Item"}
            </h2>
            <p className="text-foreground/70 mt-0.5 text-xs">
              Showcase bridal portfolios and transformation comparisons.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground rounded p-1 text-base transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Item Type Selector */}
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">
              Gallery Item Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  form.setValue("type", "single", { shouldDirty: true });
                }}
                className={`rounded-md border p-3 text-left transition-all ${
                  currentType === "single"
                    ? "border-accent bg-accent/5 ring-accent ring-1"
                    : "border-border bg-page-background hover:bg-surface"
                }`}
              >
                <p className="text-foreground text-sm font-semibold">
                  Single Image
                </p>
                <p className="text-foreground/70 text-xs">
                  Standard photo showcase
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  form.setValue("type", "before_after", { shouldDirty: true });
                }}
                className={`rounded-md border p-3 text-left transition-all ${
                  currentType === "before_after"
                    ? "border-accent bg-accent/5 ring-accent ring-1"
                    : "border-border bg-page-background hover:bg-surface"
                }`}
              >
                <p className="text-foreground text-sm font-semibold">
                  Before &amp; After
                </p>
                <p className="text-foreground/70 text-xs">
                  Interactive split slider
                </p>
              </button>
            </div>
          </div>

          {/* Image Selection Section */}
          {currentType === "single" ? (
            <div className="border-border space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <label className="text-foreground text-sm font-medium">
                  Photo (Optional if Instagram Reel is linked)
                </label>
                {mainMedia && (
                  <button
                    type="button"
                    onClick={() => {
                      setMainMedia(null);
                      form.setValue("media_id", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    className="text-xs text-[#8C2524] hover:underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-xs text-[#78716C]">
                If you enter an Instagram Reel or Post link below, you can leave
                this empty to show the look directly from Instagram.
              </p>
              {mainMedia ? (
                <div className="flex items-center gap-3">
                  <img
                    src={getPublicMediaUrl(mainMedia.storage_path)}
                    alt={mainMedia.alt_text}
                    className="h-16 w-16 rounded border bg-white object-cover"
                  />
                  <div className="flex-1 space-y-1 text-xs">
                    <p className="text-foreground font-medium">
                      {mainMedia.file_name}
                    </p>
                    <p className="text-foreground/70">{mainMedia.alt_text}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerTarget("media")}
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerTarget("media")}
                >
                  Choose Photo (Optional)
                </Button>
              )}
              {form.formState.errors.media_id && (
                <p className="text-destructive text-xs font-medium">
                  {form.formState.errors.media_id.message}
                </p>
              )}
            </div>
          ) : (
            <div className="border-border space-y-3 rounded-md border p-3">
              <div>
                <label className="text-foreground text-sm font-semibold">
                  Before &amp; After Images
                </label>
                <p className="text-foreground/70 text-xs">
                  Both images are required for comparison slider rendering.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Before Image */}
                <div className="border-border space-y-2 rounded border border-dashed p-3">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Before Image
                  </span>
                  {beforeMedia ? (
                    <div className="space-y-2">
                      <img
                        src={getPublicMediaUrl(beforeMedia.storage_path)}
                        alt={beforeMedia.alt_text}
                        className="h-20 w-full rounded bg-white object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setPickerTarget("before_media")}
                      >
                        Change Before
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setPickerTarget("before_media")}
                    >
                      Select Before Image
                    </Button>
                  )}
                  {form.formState.errors.before_media_id && (
                    <p className="text-destructive text-xs font-medium">
                      {form.formState.errors.before_media_id.message}
                    </p>
                  )}
                </div>

                {/* After Image */}
                <div className="border-border space-y-2 rounded border border-dashed p-3">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    After Image (Final Result)
                  </span>
                  {mainMedia ? (
                    <div className="space-y-2">
                      <img
                        src={getPublicMediaUrl(mainMedia.storage_path)}
                        alt={mainMedia.alt_text}
                        className="h-20 w-full rounded bg-white object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setPickerTarget("media")}
                      >
                        Change After
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setPickerTarget("media")}
                    >
                      Select After Image
                    </Button>
                  )}
                  {form.formState.errors.media_id && (
                    <p className="text-destructive text-xs font-medium">
                      {form.formState.errors.media_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <MediaPicker
            open={pickerTarget !== null}
            mode="single"
            selectedIds={
              pickerTarget === "media"
                ? mediaId
                  ? [mediaId]
                  : []
                : beforeMediaId
                  ? [beforeMediaId]
                  : []
            }
            onClose={() => setPickerTarget(null)}
            onSelect={(items) => {
              if (items.length > 0) {
                const item = items[0];
                if (pickerTarget === "media") {
                  setMainMedia(item);
                  form.setValue("media_id", item.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                } else if (pickerTarget === "before_media") {
                  setBeforeMedia(item);
                  form.setValue("before_media_id", item.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }
              setPickerTarget(null);
            }}
          />

          {/* Details */}
          <FormField
            id="title"
            label="Title (Optional)"
            hint="e.g. Royal Muhurtham Bridal Look"
            error={form.formState.errors.title?.message}
          >
            <Input
              id="title"
              {...form.register("title")}
              placeholder="e.g. Traditional Reception Glow"
            />
          </FormField>

          <FormField
            id="service_category_id"
            label="Associated Service Category (Optional)"
            error={form.formState.errors.service_category_id?.message}
          >
            <select
              id="service_category_id"
              {...form.register("service_category_id", {
                setValueAs: (v) => (!v || v === "none" ? null : v),
              })}
              className="border-border bg-page-background text-foreground focus-visible:ring-foreground h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="none">None (General Portfolio)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="caption"
            label="Caption / Notes (Optional)"
            error={form.formState.errors.caption?.message}
          >
            <textarea
              id="caption"
              rows={3}
              {...form.register("caption")}
              className="border-border bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border p-2.5 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Details on the look, skin tone matching, and hair style..."
            />
          </FormField>

          <FormField
            id="instagram_url"
            label="Instagram Reel or Post URL (Optional)"
            hint="e.g. https://www.instagram.com/reel/... or https://www.instagram.com/p/..."
            error={form.formState.errors.instagram_url?.message}
          >
            <Input
              id="instagram_url"
              {...form.register("instagram_url")}
              placeholder="https://www.instagram.com/reel/... or @nandhinimakeup"
            />
          </FormField>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_featured")}
                className="rounded border-gray-300"
              />
              <span className="text-foreground text-sm font-medium">
                Featured (highlight on homepage)
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_published")}
                className="rounded border-gray-300"
              />
              <span className="text-foreground text-sm font-medium">
                Published
              </span>
            </label>
          </div>

          {/* Dialog Actions */}
          <div className="border-border flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <SubmitButton
              isLoading={form.formState.isSubmitting}
              label={isEditing ? "Save Changes" : "Create Item"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
