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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveService } from "@/lib/actions/services";
import {
  type ServiceWithCategory,
  type ServiceCategory,
  saveServiceSchema,
  type SaveServiceInput,
} from "@/types/services";
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

interface ServiceEditDialogProps {
  open: boolean;
  service: ServiceWithCategory | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceEditDialog({
  open,
  service,
  categories,
  onClose,
  onSuccess,
}: ServiceEditDialogProps) {
  if (!open) return null;

  return (
    <ServiceEditDialogInner
      key={service?.id || "new"}
      service={service}
      categories={categories}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function SortableIncludeItem({
  id,
  text,
  onRemove,
}: {
  id: string;
  text: string;
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
      className="border-border bg-page-background flex items-center justify-between rounded border p-2 text-sm"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-foreground/50 hover:text-foreground cursor-grab touch-none p-1"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <span className="text-foreground">{text}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-foreground/70 hover:text-foreground h-7 px-2 text-xs"
      >
        Remove
      </Button>
    </div>
  );
}

function ServiceEditDialogInner({
  service,
  categories,
  onClose,
  onSuccess,
}: {
  service: ServiceWithCategory | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(service);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(
    (service?.image as MediaItem) || null
  );
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(
    null
  );
  const [newIncludeText, setNewIncludeText] = React.useState("");

  const form = useForm<SaveServiceInput>({
    resolver: zodResolver(saveServiceSchema),
    defaultValues: {
      id: service?.id,
      category_id: service?.category_id || (categories[0]?.id ?? ""),
      name: service?.name || "",
      slug: service?.slug || "",
      short_description: service?.short_description || "",
      long_description: service?.long_description || "",
      price_type: service?.price_type || "fixed",
      price:
        service?.price !== undefined
          ? service.price !== null
            ? Number(service.price)
            : null
          : 0,
      duration_minutes: service?.duration_minutes ?? null,
      image_id: service?.image_id || null,
      includes_list: service?.includes_list || [],
      is_featured: service?.is_featured ?? false,
      is_published: service?.is_published ?? true,
      sort_order: service?.sort_order ?? 0,
      seo_title: service?.seo_title || "",
      seo_description: service?.seo_description || "",
      seo_social_image_id: service?.seo_social_image_id || null,
      noindex: service?.noindex ?? false,
      focus_keyword: service?.focus_keyword || "",
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const priceType = form.watch("price_type");
  const priceValue = form.watch("price");
  const includesList = form.watch("includes_list");

  // DND setup for includes list
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = includesList.indexOf(active.id as string);
      const newIndex = includesList.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        form.setValue(
          "includes_list",
          arrayMove(includesList, oldIndex, newIndex),
          {
            shouldDirty: true,
          }
        );
      }
    }
  };

  const handleAddInclude = () => {
    if (!newIncludeText.trim()) return;
    if (!includesList.includes(newIncludeText.trim())) {
      form.setValue("includes_list", [...includesList, newIncludeText.trim()], {
        shouldDirty: true,
      });
    }
    setNewIncludeText("");
  };

  const handleRemoveInclude = (item: string) => {
    form.setValue(
      "includes_list",
      includesList.filter((i) => i !== item),
      { shouldDirty: true }
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName, { shouldValidate: true, shouldDirty: true });
    if (!slugManuallyEdited && !isEditing) {
      form.setValue("slug", slugify(newName), { shouldValidate: true });
    }
  };

  const onSubmit = async (values: SaveServiceInput) => {
    const res = await saveService({
      ...values,
      slug: slugify(values.slug),
    });

    if (!res.success) {
      toast.error(res.error || "Failed to save service");
      if (res.fieldErrors?.slug) {
        form.setError("slug", { message: res.fieldErrors.slug[0] });
      }
      return;
    }

    toast.success(
      isEditing
        ? "Service updated successfully."
        : "Service created successfully."
    );
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-dialog-title"
    >
      <div className="border-border bg-surface text-foreground my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2
              id="service-dialog-title"
              className="font-heading text-foreground text-xl font-semibold"
            >
              {isEditing ? "Edit Service" : "New Service"}
            </h2>
            <p className="text-foreground/70 mt-0.5 text-xs">
              Manage service specifications, pricing, media, and features.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="name"
              label="Service Name"
              required
              error={form.formState.errors.name?.message}
            >
              <Input
                id="name"
                {...form.register("name")}
                onChange={handleNameChange}
                placeholder="e.g. Bridal HD Makeup"
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
                placeholder="bridal-hd-makeup"
              />
            </FormField>
          </div>

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
            id="short_description"
            label="Short Description"
            hint="Brief summary shown on service cards"
            error={form.formState.errors.short_description?.message}
          >
            <Input
              id="short_description"
              {...form.register("short_description")}
              placeholder="Flawless HD bridal makeup tailored for all camera lights"
            />
          </FormField>

          <FormField
            id="long_description"
            label="Full Description"
            hint="Detailed service explanation (plain text with line breaks)"
            error={form.formState.errors.long_description?.message}
          >
            <textarea
              id="long_description"
              rows={4}
              {...form.register("long_description")}
              className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Comprehensive bridal makeup session including skin prep, contouring, eye makeup, and setting..."
            />
          </FormField>

          {/* Pricing & Duration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              id="price_type"
              label="Price Type"
              required
              error={form.formState.errors.price_type?.message}
            >
              <select
                id="price_type"
                {...form.register("price_type")}
                className="border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="fixed">Fixed Price</option>
                <option value="starting_from">Starting From</option>
                <option value="on_request">On Request</option>
              </select>
            </FormField>

            {priceType !== "on_request" && (
              <FormField
                id="price"
                label="Price (₹)"
                required
                hint={
                  priceValue !== null && priceValue !== undefined
                    ? `Formatted: ${formatINR(Number(priceValue))}`
                    : undefined
                }
                error={form.formState.errors.price?.message}
              >
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 15000"
                  {...form.register("price", {
                    setValueAs: (v) =>
                      v === "" || v === null || isNaN(Number(v))
                        ? null
                        : Number(v),
                  })}
                />
              </FormField>
            )}

            <FormField
              id="duration_minutes"
              label="Duration (minutes)"
              hint="e.g. 120 (optional)"
              error={form.formState.errors.duration_minutes?.message}
            >
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                step="5"
                placeholder="e.g. 120"
                {...form.register("duration_minutes", {
                  setValueAs: (v) =>
                    v === "" || v === null || isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
              />
            </FormField>
          </div>

          {/* Image Selection via MediaPicker */}
          <div className="border-border space-y-2 rounded-md border p-3">
            <label className="text-foreground text-sm font-medium">
              Service Image
            </label>
            <div className="flex items-center gap-4">
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
                        Change Image
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
                  Choose Service Image
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

          {/* Includes List with Drag-and-Drop Reordering */}
          <div className="border-border space-y-2 rounded-md border p-3">
            <label className="text-foreground text-sm font-medium">
              What&apos;s Included (Add / Remove / Reorder)
            </label>
            <p className="text-foreground/70 text-xs">
              List key package features or included materials. Drag items to
              reorder.
            </p>

            <div className="flex gap-2">
              <Input
                value={newIncludeText}
                onChange={(e) => setNewIncludeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInclude();
                  }
                }}
                placeholder="e.g. False lashes included, Saree draping, Hair styling"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddInclude}
              >
                Add
              </Button>
            </div>

            {includesList.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={includesList}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5 pt-2">
                    {includesList.map((item) => (
                      <SortableIncludeItem
                        key={item}
                        id={item}
                        text={item}
                        onRemove={() => handleRemoveInclude(item)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Featured & Published Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
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
                Published (visible to public)
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
              pathPrefix: "/services",
              generatedTitle: form.watch("name") || "",
              generatedDescription: form.watch("short_description") || "",
              featuredImage: selectedMedia
                ? {
                    storagePath: selectedMedia.storage_path,
                    altText: selectedMedia.alt_text,
                  }
                : null,
              firstParagraphText:
                form.watch("short_description") ||
                form.watch("long_description") ||
                "",
            }}
          />

          {/* Form Actions */}
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
              label={isEditing ? "Save Changes" : "Create Service"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
