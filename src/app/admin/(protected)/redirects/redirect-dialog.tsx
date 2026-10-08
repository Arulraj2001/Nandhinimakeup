"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type RedirectRow,
  type SaveRedirectInput,
  saveRedirectSchema,
} from "@/types/redirects";
import { saveAdminRedirect } from "@/lib/actions/redirects-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RedirectDialogProps {
  open: boolean;
  redirectItem: RedirectRow | null;
  onClose: () => void;
  onSuccess: (saved: RedirectRow) => void;
}

export function RedirectDialog({
  open,
  redirectItem,
  onClose,
  onSuccess,
}: RedirectDialogProps) {
  const [fromPath, setFromPath] = React.useState("");
  const [toPath, setToPath] = React.useState("");
  const [statusCode, setStatusCode] = React.useState<301 | 302>(301);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (redirectItem) {
      setFromPath(redirectItem.from_path);
      setToPath(redirectItem.to_path);
      setStatusCode((redirectItem.status_code as 301 | 302) || 301);
    } else {
      setFromPath("");
      setToPath("");
      setStatusCode(301);
    }
  }, [redirectItem, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: SaveRedirectInput = {
      id: redirectItem?.id,
      from_path: fromPath.trim(),
      to_path: toPath.trim(),
      status_code: statusCode,
    };

    const clientValidation = saveRedirectSchema.safeParse(payload);
    if (!clientValidation.success) {
      toast.error(
        clientValidation.error.issues[0]?.message || "Validation failed"
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveAdminRedirect(payload);
      if (res.success) {
        toast.success(
          redirectItem
            ? "Redirect updated successfully."
            : "Redirect created successfully."
        );
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || "Failed to save redirect.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="border-border bg-surface my-8 w-full max-w-lg space-y-6 rounded-lg border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-heading text-foreground text-lg font-semibold">
              {redirectItem ? "Edit Redirect" : "Create New Redirect"}
            </h2>
            <p className="text-foreground/60 mt-0.5 text-xs">
              Specify the incoming request path and its destination target.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Path */}
          <div className="space-y-1.5">
            <Label htmlFor="from_path">
              Source Path <span className="text-red-500">*</span>
            </Label>
            <Input
              id="from_path"
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/old-service-url"
              className="font-mono text-sm"
              required
            />
            <p className="text-foreground/60 text-[11px]">
              Must start with a slash (<code>/</code>). Cannot be under{" "}
              <code>/admin</code>.
            </p>
          </div>

          {/* Target Destination */}
          <div className="space-y-1.5">
            <Label htmlFor="to_path">
              Target Destination <span className="text-red-500">*</span>
            </Label>
            <Input
              id="to_path"
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="/services/new-service-url"
              className="font-mono text-sm"
              required
            />
            <p className="text-foreground/60 text-[11px]">
              Relative path (e.g. <code>/services/bridal</code>) or absolute{" "}
              <code>https://</code> URL.
            </p>
          </div>

          {/* Status Code */}
          <div className="space-y-1.5">
            <Label>Redirect Type</Label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs transition-colors ${
                  statusCode === 301
                    ? "border-foreground bg-page-background font-medium"
                    : "border-border hover:bg-page-background/50 text-foreground/70"
                }`}
              >
                <input
                  type="radio"
                  name="status_code"
                  checked={statusCode === 301}
                  onChange={() => setStatusCode(301)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-foreground font-semibold">
                    301 Permanent
                  </div>
                  <div className="text-foreground/60 text-[11px]">
                    Transfers SEO ranking equity. Recommended for moved or
                    renamed pages.
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs transition-colors ${
                  statusCode === 302
                    ? "border-foreground bg-page-background font-medium"
                    : "border-border hover:bg-page-background/50 text-foreground/70"
                }`}
              >
                <input
                  type="radio"
                  name="status_code"
                  checked={statusCode === 302}
                  onChange={() => setStatusCode(302)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-foreground font-semibold">
                    302 Temporary
                  </div>
                  <div className="text-foreground/60 text-[11px]">
                    Does not transfer ranking equity. Use for seasonal or
                    temporary redirects.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Rule Preview */}
          {fromPath && toPath && (
            <div className="border-border/80 bg-page-background/50 rounded border p-3 font-mono text-xs">
              <div className="text-foreground/50 mb-1 font-sans text-[10px] uppercase">
                Rule Preview
              </div>
              <div className="text-foreground/90 flex items-center gap-2 overflow-x-auto">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {statusCode}
                </span>
                <span>{fromPath}</span>
                <span className="text-foreground/40">→</span>
                <span className="text-green-600 dark:text-green-400">
                  {toPath}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : redirectItem
                  ? "Save Changes"
                  : "Create Redirect"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
