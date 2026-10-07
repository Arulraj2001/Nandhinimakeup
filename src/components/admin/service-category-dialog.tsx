"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saveServiceCategory } from "@/lib/actions/services";
import { type ServiceCategory, type SaveCategoryInput } from "@/types/services";
import { slugify } from "@/lib/utils/slug";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const categoryFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  is_published: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface ServiceCategoryDialogProps {
  open: boolean;
  category: ServiceCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceCategoryDialog({
  open,
  category,
  onClose,
  onSuccess,
}: ServiceCategoryDialogProps) {
  if (!open) return null;

  return (
    <CategoryDialogInner
      key={category?.id || "new"}
      category={category}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function CategoryDialogInner({
  category,
  onClose,
  onSuccess,
}: {
  category: ServiceCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(category);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      id: category?.id,
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      is_published: category?.is_published ?? true,
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

  const onSubmit = async (values: CategoryFormValues) => {
    const input: SaveCategoryInput = {
      id: values.id,
      name: values.name.trim(),
      slug: slugify(values.slug),
      description: values.description.trim(),
      sort_order: category?.sort_order ?? 0,
      is_published: values.is_published,
    };

    const res = await saveServiceCategory(input);
    if (!res.success) {
      toast.error(res.error || "Failed to save category");
      if (res.fieldErrors?.slug) {
        form.setError("slug", { message: res.fieldErrors.slug[0] });
      }
      return;
    }

    toast.success(
      isEditing
        ? "Service category updated successfully."
        : "Service category created successfully."
    );
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-dialog-title"
    >
      <div className="bg-card text-card-foreground border-border w-full max-w-md rounded-lg border p-6 shadow-xl">
        <div className="border-border border-b pb-3">
          <h2
            id="category-dialog-title"
            className="text-foreground text-lg font-semibold"
          >
            {isEditing ? "Edit Service Category" : "New Service Category"}
          </h2>
          <p className="text-foreground/70 text-xs">
            Categories organize services across your catalogue.
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
              placeholder="e.g. Bridal Makeup"
            />
          </FormField>

          <FormField
            id="slug"
            label="URL Slug"
            required
            hint="Unique identifier used in URLs (lowercase and hyphens only)"
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
              placeholder="bridal-makeup"
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
              placeholder="Optional summary for this category..."
            />
          </FormField>

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
