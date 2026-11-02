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
import {
  MediaPicker,
  getPublicMediaUrl,
} from "@/components/admin/media-picker";
import { SeoPanel } from "@/components/admin/seo-panel";
import type { MediaItem } from "@/lib/actions/media";
import {
  calculateReadingTime,
  isEmptyRichText,
  extractPlainText,
  type RichTextDoc,
  type RichTextNode,
} from "@/lib/utils/rich-text";
import { slugify } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImportPostDialog } from "./import-post-dialog";
import type { ParsedMarkdownArticle } from "@/lib/utils/markdown-to-tiptap";

interface PostEditDialogProps {
  open: boolean;
  post: BlogPostWithDetails | null;
  categories: BlogCategory[];
  defaultAuthorName?: string;
  initialImportedArticle?: ParsedMarkdownArticle | null;
  initialImportCategoryId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostEditDialog({
  open,
  post,
  categories,
  defaultAuthorName = "Nandhini Makeup & Jewellery",
  initialImportedArticle,
  initialImportCategoryId,
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
  const [featuredMedia, setFeaturedMedia] = React.useState<MediaItem | null>(
    null
  );
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [authorName, setAuthorName] = React.useState(defaultAuthorName);
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = React.useState<string>("");
  const [isFeatured, setIsFeatured] = React.useState(false);

  // SEO fields
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(
    null
  );
  const [noindex, setNoindex] = React.useState(false);
  const [focusKeyword, setFocusKeyword] = React.useState("");
  const [secondaryKeywords, setSecondaryKeywords] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);

  const hasInitializedRef = React.useRef(false);
  const prevPostIdRef = React.useRef<string | null>(null);
  const prevImportRef = React.useRef<ParsedMarkdownArticle | null>(null);

  React.useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false;
      return;
    }

    const isNewOpen = !hasInitializedRef.current;
    const isPostChanged = post?.id !== prevPostIdRef.current;
    const isNewImport = Boolean(
      initialImportedArticle && initialImportedArticle !== prevImportRef.current
    );

    if (!isNewOpen && !isPostChanged && !isNewImport) {
      return;
    }

    hasInitializedRef.current = true;
    prevPostIdRef.current = post?.id || null;
    prevImportRef.current = initialImportedArticle || null;

    if (initialImportedArticle) {
      setTitle(initialImportedArticle.title);
      setSlug(initialImportedArticle.slug);
      setIsSlugManual(true);
      setCategoryId(
        initialImportCategoryId ||
          categories.find(
            (c) =>
              c.name.toLowerCase() ===
              initialImportedArticle.categoryName?.toLowerCase()
          )?.id ||
          categories[0]?.id ||
          ""
      );
      setExcerpt(initialImportedArticle.excerpt || "");
      setContent(initialImportedArticle.content);
      setFeaturedMedia(null);
      setAuthorName(initialImportedArticle.authorName || defaultAuthorName);
      setStatus("draft");
      setPublishedAt(new Date().toISOString().slice(0, 16));
      setIsFeatured(false);
      setSeoTitle(
        initialImportedArticle.seoTitle || initialImportedArticle.title
      );
      setSeoDescription(
        initialImportedArticle.seoDescription || initialImportedArticle.excerpt
      );
      setSeoSocialMedia(null);
      setNoindex(false);
      setFocusKeyword(initialImportedArticle.focusKeyword || "");
      setSecondaryKeywords(initialImportedArticle.secondaryKeywords || "");
      setHasChanges(true);
    } else if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setIsSlugManual(true);
      setCategoryId(post.category_id || "");
      setExcerpt(post.excerpt || "");
      setContent(post.content || { type: "doc", content: [] });
      setFeaturedMedia(post.featured_image || null);
      setAuthorName(post.author_name || defaultAuthorName);
      setStatus(post.status);
      setPublishedAt(post.published_at ? post.published_at.slice(0, 16) : "");
      setIsFeatured(Boolean(post.is_featured));
      setSeoTitle(post.seo_title || "");
      setSeoDescription(post.seo_description || "");
      setSeoSocialMedia(post.seo_social_image || null);
      setNoindex(Boolean(post.noindex));
      const rawKw = post.focus_keyword || "";
      if (rawKw.includes("|")) {
        const [primary, ...rest] = rawKw.split("|");
        setFocusKeyword(primary?.trim() || "");
        setSecondaryKeywords(rest.join("|").trim());
      } else {
        setFocusKeyword(rawKw);
        setSecondaryKeywords("");
      }
      setHasChanges(false);
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
      setSeoTitle("");
      setSeoDescription("");
      setSeoSocialMedia(null);
      setNoindex(false);
      setFocusKeyword("");
      setSecondaryKeywords("");
      setHasChanges(false);
    }
  }, [
    post,
    categories,
    defaultAuthorName,
    open,
    initialImportedArticle,
    initialImportCategoryId,
  ]);

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

  const { wordCount, firstParagraph, fullText, hasInternalLink } = React.useMemo(() => {
    let firstP = "";
    let internalLink = false;
    const extractedText = extractPlainText(content);
    const words = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

    function walk(node: RichTextNode | RichTextDoc) {
      if ("type" in node && node.type === "paragraph" && !firstP) {
        const pText = extractPlainText(node as RichTextNode);
        if (pText.trim()) {
          firstP = pText.trim();
        }
      }
      if ("marks" in node && Array.isArray(node.marks)) {
        for (const m of node.marks) {
          if (m.type === "link" && m.attrs?.href) {
            const href = String(m.attrs.href).trim();
            if (
              href.startsWith("/") ||
              href.startsWith("#") ||
              href.includes("nandhinimakeup")
            ) {
              internalLink = true;
            }
          }
        }
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          walk(child);
        }
      }
    }

    walk(content);
    return {
      wordCount: words,
      firstParagraph: firstP,
      fullText: extractedText,
      hasInternalLink: internalLink,
    };
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
        toast.error(`Cannot publish post. Required: ${missing.join(", ")}.`);
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
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_social_image_id: seoSocialMedia?.id || null,
        noindex,
        focus_keyword: secondaryKeywords.trim()
          ? `${focusKeyword.trim()} | ${secondaryKeywords.trim()}`
          : focusKeyword.trim() || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="border-border bg-surface my-8 max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-lg border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-heading text-foreground text-xl font-semibold">
              {post ? "Edit Blog Post" : "New Blog Post"}
            </h2>
            <p className="text-foreground/60 mt-0.5 text-xs">
              Reading time: ~{estimatedReadingTime} min (
              {calculateReadingTime(content)} min)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {post && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive text-xs"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                title="Delete this post"
              >
                {isDeleting ? "Deleting..." : "🗑 Delete Post"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="border-[#C9A052]/50 text-xs hover:bg-[#FAF7F2] dark:hover:bg-muted"
            >
              📥 Import Markdown
            </Button>
            {post && (
              <Link
                href={`/admin/blog/preview/${post.id}`}
                target="_blank"
                className="border-border bg-page-background hover:bg-surface text-foreground rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                Preview ↗
              </Link>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="text-foreground/60 hover:text-foreground px-2 py-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="border-border bg-page-background group relative h-24 w-36 overflow-hidden rounded-md border">
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
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="border-border text-foreground/50 bg-page-background flex h-24 w-36 items-center justify-center rounded-md border border-dashed text-xs">
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
            <p className="text-muted-foreground text-xs">
              <span className="text-amber-700 dark:text-amber-400 font-medium">Google Discover Tip:</span> Use high-resolution images at least 1200px wide in 16:9 ratio (e.g. 1200×675px or 1600×900px) for maximum Discover feed visibility.
            </p>
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
          <div className="border-border grid grid-cols-1 gap-4 border-t pt-2 md:grid-cols-3">
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
              <Label htmlFor="post-published-at">
                Published Date &amp; Time
              </Label>
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
              className="border-border text-foreground focus:ring-foreground h-4 w-4 cursor-pointer rounded"
            />
            <Label
              htmlFor="is-featured"
              className="cursor-pointer text-xs font-medium"
            >
              Highlight as Featured Post (shown first on blog page 1)
            </Label>
          </div>

          {/* SEO Settings */}
          <div className="border-border border-t pt-6">
            <SeoPanel
              seoTitle={seoTitle}
              onSeoTitleChange={(val) => {
                setSeoTitle(val);
                setHasChanges(true);
              }}
              seoDescription={seoDescription}
              onSeoDescriptionChange={(val) => {
                setSeoDescription(val);
                setHasChanges(true);
              }}
              seoSocialImageId={seoSocialMedia?.id || null}
              onSeoSocialImageChange={(id, item) => {
                setSeoSocialMedia(item || null);
                setHasChanges(true);
              }}
              socialImageMedia={seoSocialMedia}
              noindex={noindex}
              onNoindexChange={(val) => {
                setNoindex(val);
                setHasChanges(true);
              }}
              focusKeyword={focusKeyword}
              onFocusKeywordChange={(val) => {
                setFocusKeyword(val);
                setHasChanges(true);
              }}
              secondaryKeywords={secondaryKeywords}
              onSecondaryKeywordsChange={(val) => {
                setSecondaryKeywords(val);
                setHasChanges(true);
              }}
              onSlugChange={(val) => {
                setSlug(val);
                setIsSlugManual(true);
                setHasChanges(true);
              }}
              context={{
                slug,
                pathPrefix: "/blog",
                generatedTitle: title,
                generatedDescription: excerpt,
                featuredImage: featuredMedia
                  ? {
                      storagePath: featuredMedia.storage_path,
                      altText: featuredMedia.alt_text,
                    }
                  : null,
                firstParagraphText: firstParagraph,
                fullContentText: fullText,
                isBlogPost: true,
                wordCount,
                hasInternalLink,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="border-border flex items-center justify-end border-t pt-4">
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
          defaultPreset="blog_featured"
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(items) => {
            if (items.length > 0) {
              setFeaturedMedia(items[0]);
              setHasChanges(true);
            }
            setMediaPickerOpen(false);
          }}
        />

        <ImportPostDialog
          open={importDialogOpen}
          categories={categories}
          onClose={() => setImportDialogOpen(false)}
          onImport={(parsed, matchedCatId) => {
            setTitle(parsed.title);
            setSlug(parsed.slug);
            setIsSlugManual(true);
            if (matchedCatId) {
              setCategoryId(matchedCatId);
            }
            setExcerpt(parsed.excerpt);
            setContent(parsed.content);
            if (parsed.authorName) {
              setAuthorName(parsed.authorName);
            }
            if (parsed.seoTitle) {
              setSeoTitle(parsed.seoTitle);
            }
            if (parsed.seoDescription) {
              setSeoDescription(parsed.seoDescription);
            }
            if (parsed.focusKeyword) {
              setFocusKeyword(parsed.focusKeyword);
            }
            if (parsed.secondaryKeywords) {
              setSecondaryKeywords(parsed.secondaryKeywords);
            }
            setHasChanges(true);
          }}
        />
      </div>
    </div>
  );
}
