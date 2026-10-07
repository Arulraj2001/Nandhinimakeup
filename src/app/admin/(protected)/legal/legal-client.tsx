"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type LegalPageRecord,
  updateLegalPage,
} from "@/lib/actions/legal-pages";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { isEmptyRichText, type RichTextDoc } from "@/lib/utils/rich-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LegalClientProps {
  initialPages: LegalPageRecord[];
}

export function LegalClient({ initialPages }: LegalClientProps) {
  const [pages, setPages] = React.useState<LegalPageRecord[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = React.useState<string>(
    initialPages[0]?.slug || "privacy-policy"
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const currentPage = pages.find((p) => p.slug === selectedSlug) || pages[0];

  const [title, setTitle] = React.useState(currentPage?.title || "");
  const [content, setContent] = React.useState<RichTextDoc>(
    (currentPage?.content as unknown as RichTextDoc) || {
      type: "doc",
      content: [],
    }
  );
  const [isPublished, setIsPublished] = React.useState(
    Boolean(currentPage?.is_published)
  );

  // When switching pages, update local state
  React.useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
      setContent(
        (currentPage.content as unknown as RichTextDoc) || {
          type: "doc",
          content: [],
        }
      );
      setIsPublished(Boolean(currentPage.is_published));
    }
  }, [currentPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPage) return;

    if (!title.trim()) {
      toast.error("Page title is required.");
      return;
    }

    if (isPublished && isEmptyRichText(content)) {
      toast.error("Cannot publish: legal page content cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateLegalPage({
        slug: currentPage.slug,
        title: title.trim(),
        content,
        is_published: isPublished,
      });

      if (res.success) {
        toast.success(`"${res.data.title}" saved successfully.`);
        setPages((prev) =>
          prev.map((p) => (p.slug === res.data.slug ? res.data : p))
        );
      } else {
        toast.error(res.error || "Failed to save legal page.");
      }
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Legal Pages List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 px-2 py-1">
            Pages
          </h3>
          <div className="space-y-1">
            {pages.map((p) => {
              const isActive = p.slug === selectedSlug;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setSelectedSlug(p.slug)}
                  className={`w-full text-left rounded-md px-3 py-2.5 transition-colors flex flex-col gap-1 ${
                    isActive
                      ? "bg-foreground text-background font-medium"
                      : "hover:bg-page-background text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        p.is_published
                          ? isActive
                            ? "bg-emerald-400 text-zinc-950"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : isActive
                          ? "bg-zinc-700 text-zinc-200"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isActive ? "text-background/70" : "text-foreground/50"
                    }`}
                  >
                    /{p.slug === "shipping-and-returns" ? "shipping-returns" : p.slug}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="lg:col-span-8">
        {currentPage ? (
          <form
            onSubmit={handleSave}
            className="rounded-lg border border-border bg-surface p-6 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Edit {currentPage.title}
                </h2>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Last updated: {formatDate(currentPage.updated_at)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSaving} size="sm">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Title field */}
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title"
                required
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between rounded-md border border-border p-3 bg-page-background">
              <div className="space-y-0.5">
                <Label htmlFor="publish-toggle" className="font-medium cursor-pointer">
                  Publish Status
                </Label>
                <p className="text-xs text-foreground/60">
                  When enabled, this legal page will be accessible publicly and linked in the footer.
                </p>
              </div>
              <input
                id="publish-toggle"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground cursor-pointer"
              />
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-1.5">
              <Label>Page Content</Label>
              <RichTextEditor
                value={content}
                onChange={(newContent) => setContent(newContent)}
                minHeight="340px"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-12 text-center text-foreground/60 text-sm">
            Select a legal page from the list to edit.
          </div>
        )}
      </div>
    </div>
  );
}
