"use client";

import * as React from "react";
import { toast } from "sonner";
import type { BlogCategory } from "@/types/blog";
import {
  parseMarkdownArticle,
  type ParsedMarkdownArticle,
} from "@/lib/utils/markdown-to-tiptap";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const AI_PROMPT_TEMPLATE = `Act as an expert South Indian bridal beauty writer for 'Nandhini Makeup & Jewellery' located in Salem, Tamil Nadu.
Write an in-depth, high-converting 1,000-word bridal guide on the topic: [ENTER YOUR TOPIC HERE, e.g. HD vs Glossy Makeup for Muhurtham and Reception].

STRICT ON-PAGE SEO AUDIT RULES (Ensure 100% Pass in our Audit Panel):
1. FOCUS KEYWORD: Choose a clear local search keyword (e.g. "HD bridal makeup Salem" or "HD vs glossy makeup").
2. SECONDARY KEYWORDS: Include 2 to 4 comma-separated relevant secondary keywords (e.g. "Muhurtham bridal look, waterproof wedding makeup, Salem wedding makeover"). Each secondary keyword must appear naturally at least once across the article body.
3. TITLE: Between 30 and 60 characters. MUST contain the exact focus keyword.
4. SEO TITLE: Between 30 and 60 characters ending with "| Nandhini". MUST contain the focus keyword.
5. SLUG: Lowercase with hyphens only, under 60 characters. MUST include the hyphenated focus keyword.
6. SEO DESCRIPTION: Between 70 and 160 characters. MUST contain the focus keyword and a consultation CTA.
7. OPENING PARAGRAPH: The very first sentence of the article body MUST naturally include the exact focus keyword.
8. WORD COUNT: The article body MUST be 800-1,200 words (comfortably over the 300-word SEO minimum).
9. NO DUPLICATE H1: Do NOT repeat the title as a # H1 in the body. Start directly with the intro paragraph or ## [First Heading].
10. COMPARISON TABLE: Include at least one comparison table using Markdown syntax (| Col 1 | Col 2 | Col 3 |).
11. BRAND MARKS:
    - Use ==text== for gold takeaway badge highlights.
    - Use [gold]text[/gold] for antique gold accents and [maroon]text[/maroon] for bridal maroon emphasis.
    - Use natural internal links: [our bridal makeup packages](/services), [antique temple jewellery rental](/jewellery), and [Salem studio consultation](/contact).

OUTPUT FORMAT TEMPLATE:

---
title: [30-60 chars containing focus_keyword, e.g. HD Bridal Makeup Salem: Muhurtham vs Reception Guide]
slug: [lowercase-hyphens containing keyword, e.g. hd-bridal-makeup-salem-finish-guide]
category: [Bridal Makeup Tips OR Jewellery Styling OR Bridal Skincare]
excerpt: [1-2 sentences under 160 chars summarizing the guide]
focus_keyword: [Exact focus phrase, e.g. HD bridal makeup Salem]
secondary_keywords: [2-4 comma-separated secondary phrases, e.g. Muhurtham bridal look, waterproof wedding makeup]
seo_title: [30-60 chars, e.g. HD Bridal Makeup Salem: Finish Guide | Nandhini]
seo_description: [70-160 chars containing focus_keyword and call to action]
author: Nandhini
---

[Opening paragraph starting with the focus keyword in the first sentence...]

## [First Major Section Heading]
[In-depth advice tailored to Tamil Nadu climate, humidity, mandapam lighting, and Kanjeevaram styling...]

### [Comparison Section]
| Feature / Factor | Muhurtham Ceremony | Reception Evening |
|---|---|---|
| Recommended Finish | HD Matte / Demi-Matte | Glossy / Dewy Glow |
| Climate Performance | ==8+ hours sweat-proof== | Fresh for 3-4 hours |
| Jewellery Pairing | [gold]Antique Nagas Temple Sets[/gold] | Diamond / Victorian Sets |

## [Expert Recommendations for Tamil Brides]
- **Tip 1:** [Actionable advice]
- **Tip 2:** [Actionable advice]

> **Nandhini's Studio Tip:** [Insider advice from our Salem bridal artists]

Explore [our bridal makeup packages](/services) or visit our [Salem studio](/contact) to book your wedding consultation.`;

interface ImportPostDialogProps {
  open: boolean;
  categories: BlogCategory[];
  onClose: () => void;
  onImport: (parsed: ParsedMarkdownArticle, categoryId: string) => void;
}

export function ImportPostDialog({
  open,
  categories,
  onClose,
  onImport,
}: ImportPostDialogProps) {
  const [markdownText, setMarkdownText] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
  const [autoInterlinkEnabled, setAutoInterlinkEnabled] = React.useState(true);

  // Live parsing
  const parsed = React.useMemo(() => {
    if (!markdownText.trim()) return null;
    try {
      return parseMarkdownArticle(markdownText, {
        enableAutoInterlinks: autoInterlinkEnabled,
      });
    } catch {
      return null;
    }
  }, [markdownText, autoInterlinkEnabled]);

  // Attempt to auto-match category when parsed changes
  React.useEffect(() => {
    if (!parsed || !categories.length) return;

    if (parsed.categoryName) {
      const normalizedTarget = parsed.categoryName.trim().toLowerCase();
      const matched = categories.find(
        (c) =>
          c.name.toLowerCase() === normalizedTarget ||
          c.slug.toLowerCase() === normalizedTarget ||
          c.name.toLowerCase().includes(normalizedTarget) ||
          normalizedTarget.includes(c.name.toLowerCase())
      );
      if (matched) {
        setSelectedCategoryId(matched.id);
        return;
      }
    }

    // If no match and nothing selected yet, default to first category
    if (!selectedCategoryId && categories[0]) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [parsed, categories, selectedCategoryId]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    toast.success("AI Master Prompt copied to clipboard! Paste into ChatGPT or Claude.");
  };

  const handleApply = () => {
    if (!parsed) {
      toast.error("Please paste markdown content first.");
      return;
    }
    if (!parsed.title.trim()) {
      toast.error("Could not determine article title. Please add a title.");
      return;
    }

    onImport(parsed, selectedCategoryId);
    toast.success("Article imported successfully! Review and choose a featured image.");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="border-border bg-surface max-h-[92vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-xl border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-foreground text-xl font-bold">
              Import Blog Article from Markdown / AI
            </h2>
            <p className="text-foreground/70 text-xs">
              Paste your Markdown content with frontmatter. All fields, SEO tags, and formatted text will populate automatically.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className="shrink-0 text-xs border-[#C9A052]/50 hover:bg-[#FAF7F2] dark:hover:bg-muted"
          >
            📋 Copy AI Prompt Template
          </Button>
        </div>

        {/* Textarea Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="markdown-input" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Paste Markdown with YAML Frontmatter
            </Label>
            {markdownText && (
              <button
                type="button"
                onClick={() => setMarkdownText("")}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            id="markdown-input"
            rows={12}
            value={markdownText}
            onChange={(e) => setMarkdownText(e.target.value)}
            placeholder={`---\ntitle: HD vs Airbrush Bridal Makeup: What Lasts Longer in Tamil Nadu?\nslug: hd-vs-airbrush-bridal-makeup-salem\ncategory: Bridal Makeup Tips\nexcerpt: In-depth comparison for Tamil Muhurtham brides...\nfocus_keyword: HD bridal makeup Salem\nsecondary_keywords: Muhurtham bridal look, waterproof wedding makeup\nseo_title: HD vs Airbrush Bridal Makeup in Salem | Nandhini\nseo_description: Expert guide comparing HD and airbrush makeup for mandapams.\nauthor: Nandhini\n---\n\n## Why Muhurtham Ceremonies Demand Specialized Makeup\nTraditional South Indian weddings involve hours around the sacred homam fire...`}
            className="border-input bg-page-background text-foreground font-mono w-full rounded-lg border p-3.5 text-xs leading-relaxed focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-none"
          />
        </div>

        {/* Live Parsing Preview Card */}
        {parsed ? (
          <div className="rounded-lg border border-[#C9A052]/40 bg-[#FAF7F2]/80 p-4 space-y-3 dark:border-border/60 dark:bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C2524] dark:text-[#C9A052]">
                ✔ Parsed Article Summary
              </span>
              <div className="flex items-center gap-2 text-[11px] text-foreground/70">
                <span className="rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 font-medium">
                  {parsed.stats.wordCount} words
                </span>
                <span className="rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 font-medium">
                  {parsed.stats.headingsCount} headings
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-foreground/60 font-medium">Title:</span>
                <p className="font-semibold text-foreground truncate">{parsed.title}</p>
              </div>
              <div>
                <span className="text-foreground/60 font-medium">URL Slug:</span>
                <p className="font-mono text-foreground/90 truncate">/blog/{parsed.slug}</p>
              </div>
              <div>
                <span className="text-foreground/60 font-medium">Focus Keyword:</span>
                <p className="font-medium text-[#8C2524] dark:text-[#C9A052] truncate">
                  {parsed.focusKeyword || "(None detected)"}
                </p>
              </div>
              <div>
                <span className="text-foreground/60 font-medium">Secondary Keywords:</span>
                <p className="text-foreground/80 truncate">
                  {parsed.secondaryKeywords || "(None detected)"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-foreground/60 font-medium">Excerpt:</span>
                <p className="text-foreground/80 line-clamp-2">{parsed.excerpt}</p>
              </div>
            </div>

            {/* Category Selector & Auto-Interlink Controls */}
            <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="import-cat" className="text-xs">
                Target Category:
              </Label>
              <select
                id="import-cat"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="border-input bg-surface text-foreground rounded-md border px-3 py-1.5 text-xs max-w-xs"
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Auto-Interlinking Control */}
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground">
                  <input
                    type="checkbox"
                    checked={autoInterlinkEnabled}
                    onChange={(e) => setAutoInterlinkEnabled(e.target.checked)}
                    className="rounded border-input text-[#8C2524] focus:ring-[#8C2524]"
                  />
                  <span>Smart Internal Linking (SEO: max 1 per target URL)</span>
                </label>
                {parsed.appliedInterlinks && parsed.appliedInterlinks.length > 0 ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {parsed.appliedInterlinks.length} link
                    {parsed.appliedInterlinks.length > 1 ? "s" : ""} applied
                  </span>
                ) : (
                  <span className="text-[11px] text-foreground/50">
                    {autoInterlinkEnabled ? "No keywords matched" : "Disabled"}
                  </span>
                )}
              </div>

              {parsed.appliedInterlinks && parsed.appliedInterlinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsed.appliedInterlinks.map((link, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded bg-[#C9A052]/15 px-2 py-0.5 text-[11px] font-medium text-[#8C2524] dark:text-[#E9D4AE]"
                    >
                      <span>&ldquo;{link.matchedText}&rdquo;</span>
                      <span className="text-foreground/50">&rarr;</span>
                      <span className="font-mono text-[10px] text-foreground/80">
                        {link.url}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-foreground/60">
            Paste an article above to see live metadata detection and stats.
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!parsed}
            onClick={handleApply}
            className="bg-[#8C2524] text-white hover:bg-[#721F1F] dark:bg-[#C9A052] dark:text-black dark:hover:bg-[#B38D43]"
          >
            Import Article &amp; Open Editor &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
