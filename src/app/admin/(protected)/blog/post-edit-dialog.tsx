/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  type SaveBlogPostInput,
  saveBlogPost,
  deleteBlogPost,
} from "@/lib/actions/blog-admin";
import type { BlogCategory, BlogPostWithDetails } from "@/types/blog";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaPicker, getPublicMediaUrl } from "@/components/admin/media-picker";
import type { MediaItem } from "@/lib/actions/media";
import {
  calculateReadingTime,
  isEmptyRichText,
  type RichTextDoc,
} from "@/lib/utils/rich-text";
import { slugify } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PostEditDialogProps {
  open: boolean;
  post: BlogPostWithDetails | null;
  categories: BlogCategory[];
  defaultAuthorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostEditDialog({
  open,
  post,
  categories,
  defaultAuthorName = "Nandhini Makeup & Jewellery",
  onClose,
  onSuccess,
}: PostEditDialogProps) {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isSlugManual, setIsSlugManual] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState<RichTextDoc>({
    type: "doc",
    content: [],
  });
  const [featuredMedia, setFeaturedMedia] = React.useState<MediaItem | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [authorName, setAuthorName] = React.useState(defaultAuthorName);
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = React.useState<string>("");
  const [isFeatured, setIsFeatured] = React.useState(false);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setIsSlugManual(true);
      setCategoryId(post.category_id || "");
      setExcerpt(post.excerpt || "");
      setContent(post.content || { type: "doc", content: [] });
      setFeaturedMedia(post.featured_image || null);
      setAuthorName(post.author_name || defaultAuthorName);
      setStatus(post.status);
      setPublishedAt(
        post.published_at ? post.published_at.slice(0, 16) : ""
      );
      setIsFeatured(Boolean(post.is_featured));
    } else {
      setTitle("");
      setSlug("");
      setIsSlugManual(false);
      setCategoryId(categories[0]?.id || "");
      setExcerpt("");
      setContent({ type: "doc", content: [] });
      setFeaturedMedia(null);
      setAuthorName(defaultAuthorName);
      setStatus("draft");
      setPublishedAt(new Date().toISOString().slice(0, 16));
      setIsFeatured(false);
    }
    setHasChanges(false);
  }, [post, categories, defaultAuthorName, open]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setHasChanges(true);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleContentChange = (newContent: RichTextDoc) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const estimatedReadingTime = React.useMemo(() => {
    return calculateReadingTime(content);
  }, [content]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Post title is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required.");
      return;
    }

    // Client-side quick check when publishing
    if (status === "published") {
      const missing: string[] = [];
      if (!title.trim()) missing.push("Title");
      if (!excerpt.trim()) missing.push("Excerpt");
      if (isEmptyRichText(content)) missing.push("Content");
      if (!featuredMedia) missing.push("Featured Image");
      if (!categoryId) missing.push("Category");

      if (missing.length > 0) {
        toast.error(
          `Cannot publish post. Required: ${missing.join(", ")}.`
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: SaveBlogPostInput = {
        id: post?.id,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content,
        featured_image_id: featuredMedia?.id || null,
        category_id: categoryId || null,
        author_name: authorName.trim() || defaultAuthorName,
        status,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        is_featured: isFeatured,
      };

      const res = await saveBlogPost(payload);
      if (res.success) {
        toast.success(
          post ? "Post updated successfully." : "Post created successfully."
        );
        setHasChanges(false);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to save post.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteBlogPost(post.id);
      if (res.success) {
        toast.success("Post deleted successfully.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to delete post.");
      }
    } catch {
      toast.error("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const discard = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );
      if (!discard) return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8 rounded-lg border border-border bg-surface p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {post ? "Edit Blog Post" : "New Blog Post"}
            </h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Reading time: ~{estimatedReadingTime} min ({calculateReadingTime(content)} min)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {post && (
              <Link
                href={`/admin/blog/preview/${post.id}`}
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-page-background hover:bg-surface text-foreground font-medium"
              >
                Preview ↗
              </Link>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="text-foreground/60 hover:text-foreground text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="post-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-title"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. 5 Essential Bridal Makeup Tips"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="post-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-slug"
                value={slug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setSlug(slugify(e.target.value));
                  setHasChanges(true);
                }}
                placeholder="e.g. 5-essential-bridal-makeup-tips"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="post-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="post-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setHasChanges(true);
                }}
                className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Image Picker */}
          <div className="space-y-2">
            <Label>
              Featured Image <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-4">
              {featuredMedia ? (
                <div className="relative h-24 w-36 rounded-md border border-border overflow-hidden bg-page-background group">
                  <img
                    src={getPublicMediaUrl(featuredMedia.storage_path)}
                    alt={featuredMedia.alt_text || featuredMedia.file_name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedMedia(null);
                      setHasChanges(true);
                    }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="h-24 w-36 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-foreground/50 bg-page-background">
                  No image selected
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaPickerOpen(true)}
              >
                {featuredMedia ? "Change Image" : "Select Featured Image"}
              </Button>
            </div>
          </div>

          {/* Excerpt with Character Counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-excerpt">
                Excerpt <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  excerpt.length > 200
                    ? "text-destructive font-medium"
                    : excerpt.length >= 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground/50"
                }`}
              >
                {excerpt.length} characters (ideal: 120–160)
              </span>
            </div>
            <textarea
              id="post-excerpt"
              rows={3}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setHasChanges(true);
              }}
              className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Brief summary of the article for blog cards and search engines..."
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-1.5">
            <Label>
              Content <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              value={content}
              onChange={handleContentChange}
              minHeight="350px"
            />
          </div>

          {/* Publishing Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="post-status">Status</Label>
              <select
                id="post-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "draft" | "published");
                  setHasChanges(true);
                }}
                className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Published At Date */}
            <div className="space-y-1.5">
              <Label htmlFor="post-published-at">Published Date &amp; Time</Label>
              <Input
                id="post-published-at"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => {
                  setPublishedAt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <Label htmlFor="post-author">Author Name</Label>
              <Input
                id="post-author"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder={defaultAuthorName}
              />
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="is-featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => {
                setIsFeatured(e.target.checked);
                setHasChanges(true);
              }}
              className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground cursor-pointer"
            />
            <Label htmlFor="is-featured" className="cursor-pointer font-medium text-xs">
              Highlight as Featured Post (shown first on blog page 1)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            {post ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? "Deleting..." : "Delete Post"}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : post
                  ? "Save Changes"
                  : status === "published"
                  ? "Publish Post"
                  : "Save Draft"}
              </Button>
            </div>
          </div>
        </form>

        <MediaPicker
          open={mediaPickerOpen}
          mode="single"
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(items) => {
            if (items.length > 0) {
              setFeaturedMedia(items[0]);
              setHasChanges(true);
            }
            setMediaPickerOpen(false);
          }}
        />
      </div>
    </div>
  );
}
