"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type SaveBlogCategoryInput,
  saveBlogCategory,
} from "@/lib/actions/blog-admin";
import type { BlogCategory } from "@/types/blog";
import { slugify } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeoPanel } from "@/components/admin/seo-panel";
import type { MediaItem } from "@/lib/actions/media";

interface CategoryDialogProps {
  open: boolean;
  category: BlogCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  category,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = React.useState(category?.name || "");
  const [slug, setSlug] = React.useState(category?.slug || "");
  const [description, setDescription] = React.useState(
    category?.description || ""
  );
  const [isSlugManual, setIsSlugManual] = React.useState(Boolean(category));
  const [isSaving, setIsSaving] = React.useState(false);

  // SEO fields
  const [seoTitle, setSeoTitle] = React.useState(
    (category as any)?.seo_title || ""
  );
  const [seoDescription, setSeoDescription] = React.useState(
    (category as any)?.seo_description || ""
  );
  const [seoSocialImageId, setSeoSocialImageId] = React.useState<string | null>(
    (category as any)?.seo_social_image_id || null
  );
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(
    null
  );
  const [noindex, setNoindex] = React.useState<boolean>(
    (category as any)?.noindex ?? false
  );
  const [focusKeyword, setFocusKeyword] = React.useState(
    (category as any)?.focus_keyword || ""
  );

  React.useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setSeoTitle((category as any).seo_title || "");
      setSeoDescription((category as any).seo_description || "");
      setSeoSocialImageId((category as any).seo_social_image_id || null);
      setNoindex((category as any).noindex ?? false);
      setFocusKeyword((category as any).focus_keyword || "");
      setIsSlugManual(true);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setSeoTitle("");
      setSeoDescription("");
      setSeoSocialImageId(null);
      setNoindex(false);
      setFocusKeyword("");
      setIsSlugManual(false);
    }
  }, [category, open]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Category slug is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: SaveBlogCategoryInput = {
        id: category?.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        sort_order: category?.sort_order ?? 0,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_social_image_id: seoSocialImageId,
        noindex,
        focus_keyword: focusKeyword.trim() || null,
      };

      const res = await saveBlogCategory(payload);
      if (res.success) {
        toast.success(
          category
            ? "Category updated successfully."
            : "Category created successfully."
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to save category.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-border bg-surface max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-lg border p-6 shadow-xl">
        <h2 className="font-heading text-foreground text-lg font-semibold">
          {category ? "Edit Category" : "New Category"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Bridal Beauty Tips"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => {
                setIsSlugManual(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. bridal-beauty-tips"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">
              Description <span className="text-foreground/50">(Optional)</span>
            </Label>
            <textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Short description of this category..."
            />
          </div>

          {/* SEO Optimization Panel */}
          <SeoPanel
            seoTitle={seoTitle}
            onSeoTitleChange={setSeoTitle}
            seoDescription={seoDescription}
            onSeoDescriptionChange={setSeoDescription}
            seoSocialImageId={seoSocialImageId}
            onSeoSocialImageChange={(id, media) => {
              setSeoSocialImageId(id);
              setSeoSocialMedia(media || null);
            }}
            noindex={noindex}
            onNoindexChange={setNoindex}
            focusKeyword={focusKeyword}
            onFocusKeywordChange={setFocusKeyword}
            socialImageMedia={seoSocialMedia}
            context={{
              slug: slug || slugify(name || ""),
              pathPrefix: "/blog/category",
              generatedTitle: `${name || ""} | Blog`,
              generatedDescription: description || "",
              firstParagraphText: description || "",
            }}
          />

          <div className="flex justify-end gap-3 pt-2">
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
                : category
                  ? "Update Category"
                  : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
