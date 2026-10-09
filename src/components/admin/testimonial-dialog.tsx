"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveTestimonial } from "@/lib/actions/content";
import {
  saveTestimonialSchema,
  type SaveTestimonialInput,
  type Testimonial,
} from "@/types/content";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TestimonialDialogProps {
  open: boolean;
  item: Testimonial | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TestimonialDialog({
  open,
  item,
  onClose,
  onSuccess,
}: TestimonialDialogProps) {
  if (!open) return null;

  return (
    <TestimonialDialogInner
      key={item?.id || "new"}
      item={item}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function TestimonialDialogInner({
  item,
  onClose,
  onSuccess,
}: {
  item: Testimonial | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(item);

  const form = useForm<SaveTestimonialInput>({
    resolver: zodResolver(saveTestimonialSchema),
    defaultValues: {
      id: item?.id,
      customer_name: item?.customer_name || "",
      occasion: item?.occasion || "",
      quote: item?.quote || "",
      rating: item?.rating ?? 5,
      source: item?.source || "direct",
      instagram_url: item?.instagram_url || "",
      is_featured: item?.is_featured ?? false,
      is_published: item?.is_published ?? true,
      sort_order: item?.sort_order ?? 0,
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: SaveTestimonialInput) => {
    const res = await saveTestimonial(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save testimonial");
      return;
    }
    toast.success(isEditing ? "Testimonial updated" : "Testimonial created");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-border bg-surface flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            {isEditing ? "Edit Testimonial" : "Add Testimonial"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <FormField
              label="Customer Name"
              required
              error={form.formState.errors.customer_name?.message}
            >
              <Input
                {...form.register("customer_name")}
                placeholder="e.g. Priya Sharma"
              />
            </FormField>

            <FormField
              label="Occasion / Descriptor"
              hint="e.g. Bridal Makeup, Reception Look, Engagement"
              error={form.formState.errors.occasion?.message}
            >
              <Input
                {...form.register("occasion")}
                placeholder="e.g. Bridal Makeup"
              />
            </FormField>

            <FormField
              label="Instagram Profile or Post URL (Optional)"
              hint="e.g. @priya_bridal or https://www.instagram.com/p/..."
              error={form.formState.errors.instagram_url?.message}
            >
              <Input
                {...form.register("instagram_url")}
                placeholder="https://www.instagram.com/... or @handle"
              />
            </FormField>

            <FormField
              label="Quote / Review (Optional)"
              hint="Optional if Instagram Reel is linked — the card will highlight the Reel."
              error={form.formState.errors.quote?.message}
            >
              <textarea
                {...form.register("quote")}
                rows={4}
                className="border-input bg-background text-foreground w-full rounded-md border p-2 text-sm"
                placeholder="The customer's kind words (optional if sharing Instagram Reel)..."
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Rating (1 to 5)"
                required
                error={form.formState.errors.rating?.message}
              >
                <select
                  {...form.register("rating", { valueAsNumber: true })}
                  className="border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value={5}>5 Stars (★★★★★)</option>
                  <option value={4}>4 Stars (★★★★☆)</option>
                  <option value={3}>3 Stars (★★★☆☆)</option>
                  <option value={2}>2 Stars (★★☆☆☆)</option>
                  <option value={1}>1 Star (★☆☆☆☆)</option>
                </select>
              </FormField>

              <FormField
                label="Source"
                required
                error={form.formState.errors.source?.message}
              >
                <select
                  {...form.register("source")}
                  className="border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="direct">Direct</option>
                  <option value="google">Google Review</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("is_featured")}
                  className="rounded border-gray-300"
                />
                <span className="text-foreground font-medium">
                  Featured on Home
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("is_published")}
                  className="rounded border-gray-300"
                />
                <span className="text-foreground font-medium">Published</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border flex items-center justify-end gap-3 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton isLoading={form.formState.isSubmitting}>
              {isEditing ? "Save Changes" : "Create Testimonial"}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
