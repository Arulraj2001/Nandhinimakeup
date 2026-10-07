/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveProduct, type ProductWithDetails } from "@/lib/actions/products";
import { type ProductCategory } from "@/types/product-categories";
import { saveProductSchema, type SaveProductInput } from "@/types/products";
import { slugify } from "@/lib/utils/slug";
import { formatINR } from "@/lib/utils/currency";
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

interface ProductEditDialogProps {
  open: boolean;
  product: ProductWithDetails | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductEditDialog({
  open,
  product,
  categories,
  onClose,
  onSuccess,
}: ProductEditDialogProps) {
  if (!open) return null;

  return (
    <ProductEditDialogInner
      key={product?.id || "new"}
      product={product}
      categories={categories}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function SortableImageItem({
  id,
  media,
  isPrimary,
  onRemove,
}: {
  id: string;
  media: MediaItem;
  isPrimary: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card relative rounded-md border p-1 ${
        isPrimary ? "ring-primary border-primary ring-2" : "border-border"
      }`}
    >
      <div className="relative h-20 w-20">
        <img
          src={getPublicMediaUrl(media.storage_path)}
          alt={media.alt_text}
          className="h-full w-full rounded bg-white object-cover"
        />
        {isPrimary && (
          <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold shadow-xs">
            Primary
          </span>
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 cursor-grab touch-none rounded bg-black/60 p-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 rounded bg-red-600 p-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Remove image"
          aria-label="Remove image"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ProductEditDialogInner({
  product,
  categories,
  onClose,
  onSuccess,
}: {
  product: ProductWithDetails | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(product);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);

  // Initial media items mapped by id
  const initialMediaItems: MediaItem[] = (product?.images || []).map(
    (img) => img.media
  );
  const [selectedMediaItems, setSelectedMediaItems] =
    React.useState<MediaItem[]>(initialMediaItems);
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(null);

  const form = useForm<SaveProductInput>({
    resolver: zodResolver(saveProductSchema),
    defaultValues: {
      id: product?.id,
      category_id: product?.category_id || (categories[0]?.id ?? ""),
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price !== undefined ? Number(product.price) : 0,
      sale_price:
        product?.sale_price !== null && product?.sale_price !== undefined
          ? Number(product.sale_price)
          : null,
      sku: product?.sku || null,
      stock_status: product?.stock_status || "in_stock",
      stock_quantity:
        product?.stock_quantity !== null &&
        product?.stock_quantity !== undefined
          ? Number(product.stock_quantity)
          : null,
      image_ids: initialMediaItems.map((m) => m.id),
      is_featured: product?.is_featured ?? false,
      is_new: product?.is_new ?? false,
      is_published: product?.is_published ?? true,
      sort_order: product?.sort_order ?? 0,
      seo_title: (product as any)?.seo_title || "",
      seo_description: (product as any)?.seo_description || "",
      seo_social_image_id: (product as any)?.seo_social_image_id || null,
      noindex: (product as any)?.noindex ?? false,
      focus_keyword: (product as any)?.focus_keyword || "",
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const imageIds = form.watch("image_ids");
  const regularPrice = form.watch("price");
  const salePrice = form.watch("sale_price");
  const isPublished = form.watch("is_published");

  // DND for Images
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = imageIds.indexOf(active.id as string);
      const newIndex = imageIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newIds = arrayMove(imageIds, oldIndex, newIndex);
        form.setValue("image_ids", newIds, { shouldDirty: true });
        setSelectedMediaItems((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  const handleRemoveImage = (mediaId: string) => {
    const newIds = imageIds.filter((id) => id !== mediaId);
    form.setValue("image_ids", newIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSelectedMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName, { shouldValidate: true, shouldDirty: true });
    if (!slugManuallyEdited && !isEditing) {
      form.setValue("slug", slugify(newName), { shouldValidate: true });
    }
  };

  const onSubmit = async (values: SaveProductInput) => {
    const res = await saveProduct({
      ...values,
      slug: slugify(values.slug),
    });

    if (!res.success) {
      toast.error(res.error || "Failed to save product");
      if (res.fieldErrors) {
        Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
          if (msgs && msgs[0]) {
            form.setError(field as keyof SaveProductInput, {
              message: msgs[0],
            });
          }
        });
      }
      return;
    }

    toast.success(
      isEditing
        ? "Product updated successfully."
        : "Product created successfully."
    );
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title"
    >
      <div className="bg-card text-card-foreground border-border my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border p-6 shadow-xl">
        <div className="border-border border-b pb-3">
          <h2
            id="product-dialog-title"
            className="text-foreground text-lg font-semibold"
          >
            {isEditing ? "Edit Product" : "New Product"}
          </h2>
          <p className="text-foreground/70 text-xs">
            Manage jewellery product details, pricing, stock, and gallery
            images.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="name"
              label="Product Name"
              required
              error={form.formState.errors.name?.message}
            >
              <Input
                id="name"
                {...form.register("name")}
                onChange={handleNameChange}
                placeholder="e.g. Traditional Temple Choker Set"
              />
            </FormField>

            <FormField
              id="slug"
              label="URL Slug"
              required
              hint="Unique lowercase hyphenated slug"
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
                placeholder="traditional-temple-choker-set"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="category_id"
              label="Category"
              required
              error={form.formState.errors.category_id?.message}
            >
              <select
                id="category_id"
                {...form.register("category_id")}
                className="border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="sku"
              label="SKU (Stock Keeping Unit)"
              hint="Unique inventory code (optional)"
              error={form.formState.errors.sku?.message}
            >
              <Input
                id="sku"
                placeholder="e.g. JW-CHOKER-001"
                {...form.register("sku", {
                  setValueAs: (v) => (!v || !v.trim() ? null : v.trim()),
                })}
              />
            </FormField>
          </div>

          <FormField
            id="description"
            label="Description"
            hint="Plain text with line breaks describing craftsmanship, materials, and care"
            error={form.formState.errors.description?.message}
          >
            <textarea
              id="description"
              rows={4}
              {...form.register("description")}
              className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Handcrafted antique matte finish temple jewellery set with matching jhumkas..."
            />
          </FormField>

          {/* Pricing Section with INR helper */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="price"
              label="Regular Price (₹)"
              required
              hint={
                regularPrice > 0
                  ? `Formatted: ${formatINR(Number(regularPrice))}`
                  : undefined
              }
              error={form.formState.errors.price?.message}
            >
              <Input
                id="price"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 2499"
                {...form.register("price", {
                  setValueAs: (v) =>
                    v === "" || v === null || isNaN(Number(v)) ? 0 : Number(v),
                })}
              />
            </FormField>

            <FormField
              id="sale_price"
              label="Sale / Offer Price (₹, optional)"
              hint={
                salePrice !== null && salePrice !== undefined && salePrice > 0
                  ? `Formatted: ${formatINR(Number(salePrice))} (Discounted)`
                  : "Must be strictly lower than regular price"
              }
              error={form.formState.errors.sale_price?.message}
            >
              <Input
                id="sale_price"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 1999"
                {...form.register("sale_price", {
                  setValueAs: (v) =>
                    v === "" ||
                    v === null ||
                    v === undefined ||
                    isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
              />
            </FormField>
          </div>

          {/* Inventory Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="stock_status"
              label="Stock Status"
              required
              error={form.formState.errors.stock_status?.message}
            >
              <select
                id="stock_status"
                {...form.register("stock_status")}
                className="border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="made_to_order">Made to Order</option>
              </select>
            </FormField>

            <FormField
              id="stock_quantity"
              label="Stock Quantity (optional)"
              hint="Leave empty if untracked / unlimited"
              error={form.formState.errors.stock_quantity?.message}
            >
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 10"
                {...form.register("stock_quantity", {
                  setValueAs: (v) =>
                    v === "" ||
                    v === null ||
                    v === undefined ||
                    isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
              />
            </FormField>
          </div>

          {/* Multi-Image Gallery with Reorder & Primary Badge */}
          <div className="border-border space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-foreground text-sm font-semibold">
                  Product Images (Required to publish)
                </label>
                <p className="text-foreground/70 text-xs">
                  The first image is the primary cover image. Drag to reorder.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaPickerOpen(true)}
              >
                Add Images
              </Button>
            </div>

            {selectedMediaItems.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={imageIds}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex flex-wrap gap-3 pt-2">
                    {selectedMediaItems.map((media, idx) => (
                      <SortableImageItem
                        key={media.id}
                        id={media.id}
                        media={media}
                        isPrimary={idx === 0}
                        onRemove={() => handleRemoveImage(media.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="border-border text-foreground/60 rounded border border-dashed p-6 text-center text-xs">
                No images added yet. Click &quot;Add Images&quot; to pick from
                the media library.
              </div>
            )}

            {form.formState.errors.is_published && (
              <p className="text-destructive text-xs font-medium" role="alert">
                {form.formState.errors.is_published.message}
              </p>
            )}
          </div>

          <MediaPicker
            open={mediaPickerOpen}
            mode="multiple"
            selectedIds={imageIds}
            onClose={() => setMediaPickerOpen(false)}
            onSelect={(newSelected) => {
              // Merge newly selected images
              const existingIds = new Set(imageIds);
              const combined = [...selectedMediaItems];
              for (const item of newSelected) {
                if (!existingIds.has(item.id)) {
                  combined.push(item);
                }
              }
              setSelectedMediaItems(combined);
              form.setValue(
                "image_ids",
                combined.map((m) => m.id),
                { shouldDirty: true, shouldValidate: true }
              );
              setMediaPickerOpen(false);
            }}
          />

          {/* Badges / Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_featured")}
                className="rounded border-gray-300"
              />
              <span className="text-foreground text-sm font-medium">
                Featured Product
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_new")}
                className="rounded border-gray-300"
              />
              <span className="text-foreground text-sm font-medium">
                New Arrival
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_published")}
                className="rounded border-gray-300"
              />
              <span className="text-foreground text-sm font-medium">
                Published{" "}
                {imageIds.length === 0 &&
                  isPublished &&
                  "(Requires at least 1 image)"}
              </span>
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
              generatedTitle: form.watch("name") || "",
              generatedDescription: form.watch("description") || "",
              featuredImage: selectedMediaItems[0]
                ? {
                    storagePath: selectedMediaItems[0].storage_path,
                    altText: selectedMediaItems[0].alt_text,
                  }
                : null,
              firstParagraphText: form.watch("description") || "",
            }}
          />

          {/* Actions */}
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
              label={isEditing ? "Save Changes" : "Create Product"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
