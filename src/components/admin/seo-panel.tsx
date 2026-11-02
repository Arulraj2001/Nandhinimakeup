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
  fullContentText?: string;
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

  secondaryKeywords?: string;
  onSecondaryKeywordsChange?: (val: string) => void;

  canonicalUrl?: string;
  onCanonicalUrlChange?: (val: string) => void;
  showCanonicalUrl?: boolean;

  socialImageMedia?: MediaItem | null;
  context: SeoPanelContext;
  onSlugChange?: (val: string) => void;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "vs",
  "or",
  "your",
  "our",
]);

interface KeywordMatchResult {
  passed: boolean;
  note: string;
  missingTerms: string[];
}

function checkKeywordInText(
  rawKeyword: string,
  targetText: string,
  type: "title" | "description" | "slug" | "paragraph"
): KeywordMatchResult {
  const kwClean = rawKeyword.trim().toLowerCase();
  const targetClean = targetText.toLowerCase();

  if (!kwClean) {
    return { passed: false, note: "No keyword provided", missingTerms: [] };
  }

  // Check if multiple comma-separated keywords provided
  const candidateKeywords = kwClean.includes(",")
    ? kwClean
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [kwClean];

  // 1. Exact phrase match against any candidate keyword
  for (const candidate of candidateKeywords) {
    const formattedCandidate =
      type === "slug"
        ? candidate.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : candidate;
    if (targetClean.includes(formattedCandidate)) {
      return {
        passed: true,
        note:
          type === "title"
            ? "Exact keyword match found in title"
            : type === "description"
            ? "Exact keyword match found in description"
            : type === "slug"
            ? "Keyword found in URL slug"
            : "Keyword found in opening text",
        missingTerms: [],
      };
    }
  }

  // 2. Term-by-term match (all significant words present)
  const primary = candidateKeywords[0];
  const terms = primary
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (terms.length === 0) {
    return {
      passed: targetClean.includes(primary),
      note: targetClean.includes(primary)
        ? "Found in text"
        : "Not found in text",
      missingTerms: targetClean.includes(primary) ? [] : [primary],
    };
  }

  const missing = terms.filter((term) => !targetClean.includes(term));

  if (missing.length === 0) {
    return {
      passed: true,
      note:
        type === "title"
          ? "All keyword terms appear in title"
          : type === "description"
          ? "All keyword terms appear in description"
          : type === "slug"
          ? "All keyword terms appear in URL slug"
          : "All keyword terms appear in opening text",
      missingTerms: [],
    };
  }

  // 3. Attention state with specific missing terms
  const missingLabel = missing.map((m) => `"${m}"`).join(", ");
  return {
    passed: false,
    note:
      type === "paragraph" && !targetClean
        ? "Intro paragraph empty or not loaded"
        : `Missing keyword term${missing.length > 1 ? "s" : ""}: ${missingLabel}`,
    missingTerms: missing,
  };
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
  secondaryKeywords = "",
  onSecondaryKeywordsChange,
  canonicalUrl,
  onCanonicalUrlChange,
  showCanonicalUrl = false,
  socialImageMedia,
  context,
  onSlugChange,
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

  const kwTitleResult = kw ? checkKeywordInText(kw, titleToCheck, "title") : null;
  const kwDescResult = kw ? checkKeywordInText(kw, descToCheck, "description") : null;
  const kwSlugResult = kw ? checkKeywordInText(kw, slugToCheck, "slug") : null;
  const kwParaResult = kw ? checkKeywordInText(kw, firstParaToCheck, "paragraph") : null;

  if (kw && kwTitleResult) {
    checklist.push({
      id: "kw-title",
      label: `Focus keyword "${focusKeyword.trim()}" in Title`,
      passed: kwTitleResult.passed,
      note: kwTitleResult.note,
    });
  }
  if (kw && kwDescResult) {
    checklist.push({
      id: "kw-desc",
      label: `Focus keyword "${focusKeyword.trim()}" in Description`,
      passed: kwDescResult.passed,
      note: kwDescResult.note,
    });
  }
  if (kw && kwSlugResult) {
    checklist.push({
      id: "kw-slug",
      label: `Focus keyword in URL Slug`,
      passed: kwSlugResult.passed,
      note: kwSlugResult.note,
    });
  }
  if (kw && kwParaResult) {
    checklist.push({
      id: "kw-first-para",
      label: `Focus keyword in opening paragraph`,
      passed: kwParaResult.passed,
      note: kwParaResult.note,
    });
  }

  if (secondaryKeywords?.trim()) {
    const rawSecondaryList = secondaryKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const fullContentTextClean = (
      context.fullContentText ||
      context.firstParagraphText ||
      ""
    ).toLowerCase();

    for (let idx = 0; idx < rawSecondaryList.length; idx++) {
      const secKw = rawSecondaryList[idx];
      const secKwClean = secKw.toLowerCase();

      let occurrences = 0;
      if (fullContentTextClean && secKwClean) {
        try {
          const escaped = secKwClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const matches = fullContentTextClean.match(new RegExp(escaped, "gi"));
          occurrences = matches ? matches.length : 0;
        } catch {
          occurrences = fullContentTextClean.includes(secKwClean) ? 1 : 0;
        }
      }

      const inTitleOrDesc =
        titleToCheck.includes(secKwClean) || descToCheck.includes(secKwClean);

      checklist.push({
        id: `kw-secondary-${idx}`,
        label: `Secondary keyword "${secKw}" present in content`,
        passed: occurrences > 0 || inTitleOrDesc,
        note:
          occurrences > 0
            ? `Found in content (${occurrences} mention${occurrences > 1 ? "s" : ""})`
            : inTitleOrDesc
              ? "Mentioned in title/meta description"
              : "Not found in content body",
      });
    }
  }

  const handleAutoAlignMetadata = () => {
    if (!focusKeyword.trim()) return;
    const cleanKw = focusKeyword.trim();

    // 1. Align Title if not already matching
    const curTitleRes = checkKeywordInText(
      cleanKw,
      seoTitle || context.generatedTitle || "",
      "title"
    );
    if (!curTitleRes.passed) {
      const baseTitle = (seoTitle || context.generatedTitle || "Bridal Guide")
        .replace(/\s*\|\s*Nandhini.*$/i, "")
        .trim();
      let newTitle = `${cleanKw}: ${baseTitle}`;
      if (newTitle.length > 60) {
        newTitle = `${cleanKw} Guide | Nandhini`.slice(0, 60);
      }
      onSeoTitleChange(newTitle);
    }

    // 2. Align Description if not already matching
    const curDescRes = checkKeywordInText(
      cleanKw,
      seoDescription || context.generatedDescription || "",
      "description"
    );
    if (!curDescRes.passed) {
      const newDesc = `Looking for expert ${cleanKw}? Discover the right finish and styling for your wedding ceremonies at Nandhini Studio Salem. Book a consultation.`;
      onSeoDescriptionChange(newDesc.slice(0, 160));
    }

    // 3. Align Slug if onSlugChange is provided and not already matching
    if (onSlugChange) {
      const curSlugRes = checkKeywordInText(cleanKw, cleanSlug, "slug");
      if (!curSlugRes.passed) {
        const kwSlug = cleanKw
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const currentSlugSuffix = cleanSlug.replace(
          new RegExp(`^${kwSlug}-?`),
          ""
        );
        const combined = `${kwSlug}-${currentSlugSuffix || "guide"}`
          .slice(0, 50)
          .replace(/-+$/, "");
        onSlugChange(combined);
      }
    }
  };

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

      {/* Focus Keyword & Secondary Keywords Row */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="focus_keyword"
            className="text-foreground text-sm font-medium"
          >
            Focus Keyword (Primary)
          </label>
          <Input
            id="focus_keyword"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder="e.g. HD bridal makeup Salem"
          />
          <p className="text-muted-foreground text-xs">
            Primary search target. Checked in Title, URL Slug, Meta Description &amp; Intro.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="secondary_keywords"
            className="text-foreground text-sm font-medium"
          >
            Secondary Keywords (Supporting)
          </label>
          <Input
            id="secondary_keywords"
            value={secondaryKeywords}
            onChange={(e) => onSecondaryKeywordsChange?.(e.target.value)}
            placeholder="e.g. glossy bridal makeup, muhurtham look"
          />
          <p className="text-muted-foreground text-xs">
            Comma-separated secondary phrases. Audited for mentions across the article body.
          </p>
        </div>
      </div>

      {/* Indexing Directive */}
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
        defaultPreset="blog_featured"
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
        <div className="border-border border-b pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              SEO Audit Checklist (Deterministic)
            </h4>
            <p className="text-muted-foreground text-xs">
              On-page content rules and length compliance without arbitrary
              scoring.
            </p>
          </div>
          {focusKeyword.trim() &&
            (kwTitleResult?.passed === false ||
              kwDescResult?.passed === false ||
              kwSlugResult?.passed === false) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAutoAlignMetadata}
                className="shrink-0 h-7 text-[11px] border-[#C9A052]/60 text-[#8C2524] hover:bg-[#FAF7F2] dark:text-[#C9A052] dark:hover:bg-muted font-medium"
              >
                ⚡ Auto-Align Metadata
              </Button>
            )}
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
