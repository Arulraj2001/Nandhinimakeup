"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveAnnouncement } from "@/lib/actions/content";
import {
  saveAnnouncementSchema,
  type SaveAnnouncementInput,
  type Announcement,
} from "@/types/content";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AnnouncementDialogProps {
  open: boolean;
  item: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AnnouncementDialog({
  open,
  item,
  onClose,
  onSuccess,
}: AnnouncementDialogProps) {
  if (!open) return null;

  return (
    <AnnouncementDialogInner
      key={item?.id || "new"}
      item={item}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function AnnouncementDialogInner({
  item,
  onClose,
  onSuccess,
}: {
  item: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(item);

  // Format date helper for datetime-local input
  const formatForInput = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return "";
    }
  };

  const form = useForm<SaveAnnouncementInput>({
    resolver: zodResolver(saveAnnouncementSchema),
    defaultValues: {
      id: item?.id,
      message: item?.message || "",
      link_url: item?.link_url || "",
      link_label: item?.link_label || "",
      is_active: item?.is_active ?? true,
      start_date: formatForInput(item?.start_date),
      end_date: formatForInput(item?.end_date),
    },
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: SaveAnnouncementInput) => {
    const res = await saveAnnouncement(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save announcement");
      return;
    }
    toast.success(isEditing ? "Announcement updated" : "Announcement created");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-border bg-surface flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            {isEditing ? "Edit Announcement" : "New Announcement Bar"}
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
              label="Message"
              hint="Headline message shown on top of the website"
              required
              error={form.formState.errors.message?.message}
            >
              <Input
                {...form.register("message")}
                placeholder="e.g. Booking for Wedding Season 2026 now open!"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Link URL"
                hint="Must start with / or https://"
                error={form.formState.errors.link_url?.message}
              >
                <Input
                  {...form.register("link_url")}
                  placeholder="/services or https://..."
                />
              </FormField>

              <FormField
                label="Link Label"
                hint="e.g. Learn More, Book Now"
                error={form.formState.errors.link_label?.message}
              >
                <Input
                  {...form.register("link_label")}
                  placeholder="e.g. Book Now"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Start Date & Time (Optional)"
                error={form.formState.errors.start_date?.message}
              >
                <Input type="datetime-local" {...form.register("start_date")} />
              </FormField>

              <FormField
                label="End Date & Time (Optional)"
                error={form.formState.errors.end_date?.message}
              >
                <Input type="datetime-local" {...form.register("end_date")} />
              </FormField>
            </div>

            <div className="pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("is_active")}
                  className="rounded border-gray-300"
                />
                <span className="text-foreground font-medium">
                  Active (enable to show on site during schedule)
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border flex items-center justify-end gap-3 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton isLoading={form.formState.isSubmitting}>
              {isEditing ? "Save Changes" : "Create Announcement"}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
