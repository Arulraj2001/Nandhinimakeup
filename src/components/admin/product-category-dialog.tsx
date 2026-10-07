/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  saveProductCategory,
  type ProductCategoryWithImage,
} from "@/lib/actions/product-categories";
import {
  saveProductCategorySchema,
  type SaveProductCategoryInput,
} from "@/types/product-categories";
import { slugify } from "@/lib/utils/slug";
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
import { SeoPanel } from "@/components/admin/seo-panel";

interface ProductCategoryDialogProps {
  open: boolean;
  category: ProductCategoryWithImage | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductCategoryDialog({
  open,
  category,
  onClose,
  onSuccess,
}: ProductCategoryDialogProps) {
  if (!open) return null;

  return (
    <ProductCategoryDialogInner
      key={category?.id || "new"}
      category={category}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function ProductCategoryDialogInner({
  category,
  onClose,
  onSuccess,
}: {
  category: ProductCategoryWithImage | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(category);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(
    (category?.image as MediaItem) || null
  );
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(null);

  const form = useForm<SaveProductCategoryInput>({
    resolver: zodResolver(saveProductCategorySchema),
    defaultValues: {
      id: category?.id,
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      image_id: category?.image_id || null,
      sort_order: category?.sort_order ?? 0,
      is_published: category?.is_published ?? true,
      seo_title: (category as any)?.seo_title || "",
      seo_description: (category as any)?.seo_description || "",
      seo_social_image_id: (category as any)?.seo_social_image_id || null,
      noindex: (category as any)?.noindex ?? false,
      focus_keyword: (category as any)?.focus_keyword || "",
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName, { shouldValidate: true, shouldDirty: true });
    if (!slugManuallyEdited && !isEditing) {
      form.setValue("slug", slugify(newName), { shouldValidate: true });
    }
  };

  const onSubmit = async (values: SaveProductCategoryInput) => {
    const res = await saveProductCategory({
      ...values,
      name: values.name.trim(),
      slug: slugify(values.slug),
      description: values.description.trim(),
    });

    if (!res.success) {
      toast.error(res.error || "Failed to save category");
      if (res.fieldErrors?.slug) {
        form.setError("slug", { message: res.fieldErrors.slug[0] });
      }
      return;
    }

    toast.success(
      isEditing
        ? "Product category updated successfully."
        : "Product category created successfully."
    );
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-cat-title"
    >
      <div className="bg-card text-card-foreground border-border w-full max-w-md rounded-lg border p-6 shadow-xl">
        <div className="border-border border-b pb-3">
          <h2
            id="product-cat-title"
            className="text-foreground text-lg font-semibold"
          >
            {isEditing ? "Edit Product Category" : "New Product Category"}
          </h2>
          <p className="text-foreground/70 text-xs">
            Categories classify jewellery and accessories in your shop.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <FormField
            id="name"
            label="Category Name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="name"
              {...form.register("name")}
              onChange={handleNameChange}
              placeholder="e.g. Bridal Jewellery Sets"
            />
          </FormField>

          <FormField
            id="slug"
            label="URL Slug"
            required
            hint="Unique identifier used in URLs"
            error={form.formState.errors.slug?.message}
          >
            <Input
              id="slug"
              {...form.register("slug")}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                form.setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              placeholder="bridal-jewellery-sets"
            />
          </FormField>

          <FormField
            id="description"
            label="Description"
            error={form.formState.errors.description?.message}
          >
            <textarea
              id="description"
              rows={3}
              {...form.register("description")}
              className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Optional summary for this product category..."
            />
          </FormField>

          {/* Category Cover Image */}
          <div className="border-border space-y-2 rounded-md border p-3">
            <label className="text-foreground text-sm font-medium">
              Category Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              {selectedMedia ? (
                <div className="flex items-center gap-3">
                  <img
                    src={getPublicMediaUrl(selectedMedia.storage_path)}
                    alt={selectedMedia.alt_text}
                    className="h-16 w-16 rounded border bg-white object-cover"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="text-foreground font-medium">
                      {selectedMedia.file_name}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMediaPickerOpen(true)}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMedia(null);
                          form.setValue("image_id", null, {
                            shouldDirty: true,
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  Choose Cover Image
                </Button>
              )}
            </div>
          </div>

          <MediaPicker
            open={mediaPickerOpen}
            mode="single"
            selectedIds={selectedMedia ? [selectedMedia.id] : []}
            onClose={() => setMediaPickerOpen(false)}
            onSelect={(items) => {
              if (items.length > 0) {
                setSelectedMedia(items[0]);
                form.setValue("image_id", items[0].id, { shouldDirty: true });
              }
              setMediaPickerOpen(false);
            }}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              id="is_published"
              type="checkbox"
              {...form.register("is_published")}
              className="rounded border-gray-300"
            />
            <label
              htmlFor="is_published"
              className="text-foreground cursor-pointer text-sm font-medium"
            >
              Published (visible to public)
            </label>
          </div>

          {/* SEO Optimization Panel */}
          <SeoPanel
            seoTitle={form.watch("seo_title") || ""}
            onSeoTitleChange={(val) =>
              form.setValue("seo_title", val, { shouldDirty: true })
            }
            seoDescription={form.watch("seo_description") || ""}
            onSeoDescriptionChange={(val) =>
              form.setValue("seo_description", val, { shouldDirty: true })
            }
            seoSocialImageId={form.watch("seo_social_image_id") || null}
            onSeoSocialImageChange={(id, media) => {
              form.setValue("seo_social_image_id", id, { shouldDirty: true });
              setSeoSocialMedia(media || null);
            }}
            noindex={form.watch("noindex")}
            onNoindexChange={(val) =>
              form.setValue("noindex", val, { shouldDirty: true })
            }
            focusKeyword={form.watch("focus_keyword") || ""}
            onFocusKeywordChange={(val) =>
              form.setValue("focus_keyword", val, { shouldDirty: true })
            }
            socialImageMedia={seoSocialMedia}
            context={{
              slug: form.watch("slug") || slugify(form.watch("name") || ""),
              pathPrefix: "/jewellery",
              generatedTitle: `${form.watch("name") || ""} Jewellery`,
              generatedDescription: form.watch("description") || "",
              featuredImage: selectedMedia
                ? {
                    storagePath: selectedMedia.storage_path,
                    altText: selectedMedia.alt_text,
                  }
                : null,
              firstParagraphText: form.watch("description") || "",
            }}
          />

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
              label={isEditing ? "Save Changes" : "Create Category"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
