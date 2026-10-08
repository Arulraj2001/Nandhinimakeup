/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/admin/form-helpers";
import {
  MediaPicker,
  getPublicMediaUrl,
} from "@/components/admin/media-picker";
import type { MediaItem } from "@/lib/actions/media";

export interface SeoPanelContext {
  siteName?: string;
  siteUrl?: string;
  slug: string;
  pathPrefix?: string; // e.g. "/services", "/blog", "/jewellery"
  generatedTitle?: string;
  generatedDescription?: string;
  featuredImage?: {
    storagePath?: string;
    altText?: string;
  } | null;
  firstParagraphText?: string;
  isBlogPost?: boolean;
  wordCount?: number;
  hasInternalLink?: boolean;
}

export interface SeoPanelProps {
  seoTitle: string;
  onSeoTitleChange: (val: string) => void;

  seoDescription: string;
  onSeoDescriptionChange: (val: string) => void;

  seoSocialImageId: string | null;
  onSeoSocialImageChange: (id: string | null, media?: MediaItem | null) => void;

  noindex: boolean;
  onNoindexChange: (val: boolean) => void;

  focusKeyword: string;
  onFocusKeywordChange: (val: string) => void;

  canonicalUrl?: string;
  onCanonicalUrlChange?: (val: string) => void;
  showCanonicalUrl?: boolean;

  socialImageMedia?: MediaItem | null;
  context: SeoPanelContext;
}

export function SeoPanel({
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  seoSocialImageId,
  onSeoSocialImageChange,
  noindex,
  onNoindexChange,
  focusKeyword,
  onFocusKeywordChange,
  canonicalUrl,
  onCanonicalUrlChange,
  showCanonicalUrl = false,
  socialImageMedia,
  context,
}: SeoPanelProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<
    "desktop" | "mobile"
  >("desktop");

  const siteName = context.siteName || "Nandhini Makeup & Jewellery";
  const pathPrefix = context.pathPrefix || "";
  const cleanSlug = context.slug.trim().replace(/^\//, "");
  const fullPath = pathPrefix
    ? `${pathPrefix}/${cleanSlug}`.replace(/\/+/g, "/")
    : `/${cleanSlug}`.replace(/\/+/g, "/");

  // Effective values for preview
  const effectiveTitle = seoTitle.trim() || context.generatedTitle || siteName;
  const fullPreviewTitle =
    effectiveTitle.includes(siteName) || !siteName
      ? effectiveTitle
      : `${effectiveTitle} | ${siteName}`;

  const effectiveDescription =
    seoDescription.trim() ||
    context.generatedDescription ||
    "Professional bridal makeup artistry and premium handcrafted jewellery.";

  const effectiveImageStoragePath =
    socialImageMedia?.storage_path || context.featuredImage?.storagePath;
  const effectiveImageUrl = effectiveImageStoragePath
    ? getPublicMediaUrl(effectiveImageStoragePath)
    : null;
  const effectiveImageAlt =
    socialImageMedia?.alt_text || context.featuredImage?.altText || "";

  // Title Counter (Ideal 30-60, hard limit 70)
  const titleLen = seoTitle.length;
  const isTitleIdeal = titleLen >= 30 && titleLen <= 60;
  const isTitleOver = titleLen > 70;

  // Description Counter (Ideal 70-160, hard limit 200)
  const descLen = seoDescription.length;
  const isDescIdeal = descLen >= 70 && descLen <= 160;
  const isDescOver = descLen > 200;

  // Deterministic Checklist Calculation
  const kw = focusKeyword.trim().toLowerCase();
  const titleToCheck = (seoTitle || context.generatedTitle || "").toLowerCase();
  const descToCheck = (
    seoDescription ||
    context.generatedDescription ||
    ""
  ).toLowerCase();
  const slugToCheck = cleanSlug.toLowerCase();
  const firstParaToCheck = (context.firstParagraphText || "").toLowerCase();

  const isSlugValid =
    Boolean(cleanSlug) &&
    /^[a-z0-9-]+$/.test(cleanSlug) &&
    cleanSlug.length <= 60;

  const hasImage = Boolean(
    socialImageMedia || context.featuredImage?.storagePath
  );
  const hasImageAlt = hasImage && Boolean(effectiveImageAlt.trim());

  const checklist = [
    {
      id: "title-length",
      label: "Title length in range (30 - 60 chars)",
      passed:
        isTitleIdeal || (titleLen === 0 && Boolean(context.generatedTitle)),
      note: `${titleLen} / 70 characters (ideal 30-60)`,
    },
    {
      id: "desc-length",
      label: "Description length in range (70 - 160 chars)",
      passed:
        isDescIdeal || (descLen === 0 && Boolean(context.generatedDescription)),
      note: `${descLen} / 200 characters (ideal 70-160)`,
    },
    {
      id: "image-alt",
      label: "Social or featured image present with descriptive alt text",
      passed: hasImage && hasImageAlt,
      note: hasImage
        ? hasImageAlt
          ? `Image set with alt text: "${effectiveImageAlt}"`
          : "Image present, but missing alt text"
        : "No image assigned",
    },
    {
      id: "slug-format",
      label: "Slug is clean and readable (short, lowercase, hyphens only)",
      passed: isSlugValid,
      note: isSlugValid
        ? `Valid: /${cleanSlug}`
        : "Contains uppercase, invalid characters, or exceeds 60 characters",
    },
  ];

  if (kw) {
    checklist.push(
      {
        id: "kw-title",
        label: `Focus keyword "${kw}" appears in Title`,
        passed: titleToCheck.includes(kw),
        note: titleToCheck.includes(kw)
          ? "Found in title"
          : "Not found in title",
      },
      {
        id: "kw-desc",
        label: `Focus keyword "${kw}" appears in Description`,
        passed: descToCheck.includes(kw),
        note: descToCheck.includes(kw)
          ? "Found in description"
          : "Not found in description",
      },
      {
        id: "kw-slug",
        label: `Focus keyword appears in URL Slug`,
        passed: slugToCheck.includes(kw.replace(/\s+/g, "-")),
        note: slugToCheck.includes(kw.replace(/\s+/g, "-"))
          ? "Found in slug"
          : "Not found in slug",
      },
      {
        id: "kw-first-para",
        label: `Focus keyword appears in first paragraph`,
        passed: firstParaToCheck.includes(kw),
        note: firstParaToCheck.includes(kw)
          ? "Found in first paragraph"
          : "Not found in intro text",
      }
    );
  }

  if (context.isBlogPost) {
    const wordCount = context.wordCount || 0;
    checklist.push(
      {
        id: "blog-words",
        label: "Blog post word count at least 300 words",
        passed: wordCount >= 300,
        note: `${wordCount} words (minimum 300 recommended)`,
      },
      {
        id: "blog-internal-links",
        label: "Contains at least one internal link",
        passed: Boolean(context.hasInternalLink),
        note: context.hasInternalLink
          ? "Internal link present"
          : "No internal links detected",
      }
    );
  }

  return (
    <div className="border-border bg-card-surface text-foreground space-y-6 rounded-xl border p-4 sm:p-6">
      <div className="border-border flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-foreground text-base font-semibold">
            Search Engine Optimisation (SEO)
          </h3>
          <p className="text-muted-foreground text-xs">
            Configure metadata, search snippets, indexing directives, and social
            cards.
          </p>
        </div>
        {noindex && (
          <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
            noindex enabled
          </span>
        )}
      </div>

      {/* SEO Title Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="seo_title"
            className="text-foreground text-sm font-medium"
          >
            SEO Title
          </label>
          <span
            className={`text-xs ${
              isTitleOver
                ? "text-destructive font-semibold"
                : isTitleIdeal
                  ? "font-medium text-emerald-600"
                  : "text-muted-foreground"
            }`}
          >
            {titleLen} / 70 {isTitleIdeal && "✓ Ideal"}
          </span>
        </div>
        <Input
          id="seo_title"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value.slice(0, 70))}
          placeholder={
            context.generatedTitle ||
            "Custom SEO Title (defaults to entity title)"
          }
          maxLength={70}
        />
        <p className="text-muted-foreground text-xs">
          Recommended length: 30–60 characters. Hard limit: 70 characters.
        </p>
      </div>

      {/* SEO Description Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="seo_description"
            className="text-foreground text-sm font-medium"
          >
            SEO Meta Description
          </label>
          <span
            className={`text-xs ${
              isDescOver
                ? "text-destructive font-semibold"
                : isDescIdeal
                  ? "font-medium text-emerald-600"
                  : "text-muted-foreground"
            }`}
          >
            {descLen} / 200 {isDescIdeal && "✓ Ideal"}
          </span>
        </div>
        <textarea
          id="seo_description"
          rows={3}
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value.slice(0, 200))}
          placeholder={
            context.generatedDescription ||
            "Custom meta description (defaults to entity summary or excerpt)"
          }
          maxLength={200}
          className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
        />
        <p className="text-muted-foreground text-xs">
          Recommended length: 70–160 characters. Hard limit: 200 characters.
        </p>
      </div>

      {/* Focus Keyword & Noindex Row */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="focus_keyword"
            className="text-foreground text-sm font-medium"
          >
            Focus Keyword (Admin Helper)
          </label>
          <Input
            id="focus_keyword"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder="e.g. bridal makeup salem"
          />
          <p className="text-muted-foreground text-xs">
            Internal on-page reference. Used only for the deterministic
            checklist below.
          </p>
        </div>

        <div className="border-border bg-muted/20 space-y-1.5 rounded-lg border p-3">
          <label className="text-foreground block text-sm font-medium">
            Search Indexing Directive
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="noindex_toggle"
              checked={noindex}
              onChange={(e) => onNoindexChange(e.target.checked)}
              className="border-border text-primary focus:ring-ring h-4 w-4 rounded"
            />
            <span className="text-foreground text-sm">
              Block search engines (<code className="text-xs">noindex</code>)
            </span>
          </label>
          <p className="text-muted-foreground pt-1 text-xs">
            When checked, search engines are instructed not to index this
            specific page.
          </p>
        </div>
      </div>

      {/* Optional Canonical URL (for Static Pages) */}
      {showCanonicalUrl && onCanonicalUrlChange && (
        <FormField
          id="canonical_url"
          label="Canonical URL Override (Optional)"
          hint="Same-site URL only. Used when this page duplicates another page's content."
        >
          <Input
            id="canonical_url"
            value={canonicalUrl || ""}
            onChange={(e) => onCanonicalUrlChange(e.target.value)}
            placeholder="e.g. /services or https://nandhinimakeup.com/services"
          />
        </FormField>
      )}

      {/* Social Image Picker */}
      <div className="border-border bg-muted/10 space-y-2 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-foreground block text-sm font-medium">
              Dedicated Social Share Image (OG Image)
            </label>
            <p className="text-muted-foreground text-xs">
              Overrides the featured image for social media link previews
              (1200x630 recommended).
            </p>
          </div>
        </div>

        {socialImageMedia ? (
          <div className="flex items-center gap-4 pt-2">
            <img
              src={getPublicMediaUrl(socialImageMedia.storage_path)}
              alt={socialImageMedia.alt_text || "Social image"}
              className="h-16 w-28 rounded border bg-white object-cover shadow-xs"
            />
            <div className="space-y-1">
              <p className="text-foreground text-xs font-medium">
                {socialImageMedia.file_name}
              </p>
              <p className="text-muted-foreground text-xs">
                Alt: {socialImageMedia.alt_text || "(none)"}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onSeoSocialImageChange(null, null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              Select Social Image
            </Button>
            {context.featuredImage?.storagePath && (
              <span className="text-muted-foreground text-xs">
                Currently falling back to entity featured image.
              </span>
            )}
          </div>
        )}
      </div>

      <MediaPicker
        open={pickerOpen}
        selectedIds={seoSocialImageId ? [seoSocialImageId] : []}
        onClose={() => setPickerOpen(false)}
        onSelect={(items) => {
          if (items.length > 0) {
            onSeoSocialImageChange(items[0].id, items[0]);
          }
          setPickerOpen(false);
        }}
      />

      {/* Google-Style Search Result Preview */}
      <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Search Result Preview
          </span>
          <div className="border-border bg-background flex items-center gap-1 rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                previewDevice === "desktop"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                previewDevice === "mobile"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Snippet Card */}
        <div
          className={`rounded-lg border border-slate-200 bg-white p-4 text-left font-sans shadow-xs ${
            previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"
          }`}
        >
          {/* Header Line */}
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
              ●
            </div>
            <div className="truncate text-xs text-slate-700">
              <span className="font-medium">{siteName}</span>
              <span className="mx-1 text-slate-400">›</span>
              <span className="text-slate-500">
                {fullPath}
              </span>
            </div>
          </div>

          {/* Title */}
          <h4 className="mb-1 line-clamp-2 cursor-pointer text-base leading-snug font-normal text-[#1a0dab] hover:underline sm:text-lg">
            {fullPreviewTitle}
          </h4>

          {/* Description & Thumbnail layout */}
          <div className="flex items-start gap-3">
            <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-[#4d5156] sm:text-sm">
              {effectiveDescription}
            </p>
            {effectiveImageUrl && previewDevice === "mobile" && (
              <img
                src={effectiveImageUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-md border border-slate-200 object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Deterministic Checklist */}
      <div className="border-border bg-page-background space-y-3 rounded-xl border p-4">
        <div className="border-border border-b pb-2">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            SEO Audit Checklist (Deterministic)
          </h4>
          <p className="text-muted-foreground text-xs">
            On-page content rules and length compliance without arbitrary
            scoring.
          </p>
        </div>

        <div className="divide-border/60 divide-y">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5 text-xs"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    item.passed
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.passed ? "✓" : "○"}
                </span>
                <div>
                  <p
                    className={`font-medium ${
                      item.passed ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-muted-foreground">{item.note}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  item.passed
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.passed ? "Pass" : "Attention"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
