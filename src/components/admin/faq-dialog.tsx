"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveFAQ } from "@/lib/actions/content";
import { saveFAQSchema, type SaveFAQInput, type FAQ } from "@/types/content";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FAQDialogProps {
  open: boolean;
  item: FAQ | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FAQDialog({ open, item, onClose, onSuccess }: FAQDialogProps) {
  if (!open) return null;

  return (
    <FAQDialogInner
      key={item?.id || "new"}
      item={item}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function FAQDialogInner({
  item,
  onClose,
  onSuccess,
}: {
  item: FAQ | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(item);

  const form = useForm<SaveFAQInput>({
    resolver: zodResolver(saveFAQSchema),
    defaultValues: {
      id: item?.id,
      question: item?.question || "",
      answer: item?.answer || "",
      group: (item?.group as SaveFAQInput["group"]) || "general",
      is_published: item?.is_published ?? true,
      sort_order: item?.sort_order ?? 0,
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: SaveFAQInput) => {
    const res = await saveFAQ(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save FAQ");
      return;
    }
    toast.success(isEditing ? "FAQ updated" : "FAQ created");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-page-background border-border flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border shadow-lg">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            {isEditing ? "Edit FAQ" : "Add FAQ"}
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
              label="Question"
              required
              error={form.formState.errors.question?.message}
            >
              <Input
                {...form.register("question")}
                placeholder="e.g. How early in advance should I book bridal makeup?"
              />
            </FormField>

            <FormField
              label="Answer"
              hint="Plain text with line breaks allowed."
              required
              error={form.formState.errors.answer?.message}
            >
              <textarea
                {...form.register("answer")}
                rows={5}
                className="border-input bg-background text-foreground w-full rounded-md border p-2 text-sm"
                placeholder="Enter detailed answer here..."
              />
            </FormField>

            <FormField
              label="Group"
              required
              error={form.formState.errors.group?.message}
            >
              <select
                {...form.register("group")}
                className="border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="general">General</option>
                <option value="services">Services</option>
                <option value="jewellery">Jewellery</option>
                <option value="orders_and_shipping">Orders & Shipping</option>
              </select>
            </FormField>

            <div className="pt-2">
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
              {isEditing ? "Save Changes" : "Create FAQ"}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
