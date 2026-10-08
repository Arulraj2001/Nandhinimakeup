"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  STATIC_PAGES_LIST,
  type StaticPageMeta,
  type StaticPageSeoRowWithMedia,
} from "@/types/seo";
import type { SiteSettingsData } from "@/types/settings";
import type { MediaItem } from "@/lib/actions/media";
import { saveStaticPageSeo } from "@/lib/actions/seo-admin";
import { SeoPanel } from "@/components/admin/seo-panel";
import { SeoSettingsForm } from "../settings/settings-client";
import { Button } from "@/components/ui/button";

interface SeoAdminClientProps {
  initialStaticPages: StaticPageSeoRowWithMedia[];
  initialSettings: SiteSettingsData;
  initialMediaMap: Record<string, MediaItem>;
}

export function SeoAdminClient({
  initialStaticPages,
  initialSettings,
  initialMediaMap,
}: SeoAdminClientProps) {
  const [activeTab, setActiveTab] = React.useState<"static" | "global">(
    "static"
  );
  const [staticPages, setStaticPages] =
    React.useState<StaticPageSeoRowWithMedia[]>(initialStaticPages);
  const [mediaMap, setMediaMap] =
    React.useState<Record<string, MediaItem>>(initialMediaMap);
  const [editingPage, setEditingPage] = React.useState<StaticPageMeta | null>(
    null
  );

  const handleMediaMapUpdate = (item: MediaItem) => {
    setMediaMap((prev) => ({ ...prev, [item.id]: item }));
  };

  const handlePageSaved = (savedRow: StaticPageSeoRowWithMedia) => {
    setStaticPages((prev) => {
      const idx = prev.findIndex((p) => p.path === savedRow.path);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedRow;
        return next;
      }
      return [...prev, savedRow];
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-border flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("static")}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "static"
              ? "border-foreground text-foreground font-semibold"
              : "text-foreground/60 hover:text-foreground border-transparent"
          }`}
        >
          Static Pages SEO ({STATIC_PAGES_LIST.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("global")}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "global"
              ? "border-foreground text-foreground font-semibold"
              : "text-foreground/60 hover:text-foreground border-transparent"
          }`}
        >
          Global SEO & Discovery Settings
        </button>
      </div>

      {activeTab === "static" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-base font-semibold">
                Static Pages SEO Configuration
              </h2>
              <p className="text-foreground/70 text-xs">
                Manage titles, descriptions, social images, and canonical URLs
                for every core page. Custom values override generated defaults.
              </p>
            </div>
          </div>

          <div className="border-border bg-surface overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-border bg-page-background/50 text-foreground/70 border-b text-xs uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Page
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Path
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Title Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Description Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Indexing
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {STATIC_PAGES_LIST.map((pageMeta) => {
                  const record = staticPages.find(
                    (p) => p.path === pageMeta.path
                  );
                  const hasCustomTitle = Boolean(
                    record?.title && record.title.trim()
                  );
                  const hasCustomDesc = Boolean(
                    record?.description && record.description.trim()
                  );
                  const isNoindex = Boolean(record?.noindex);

                  return (
                    <tr
                      key={pageMeta.path}
                      className="hover:bg-page-background/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-foreground block font-medium">
                          {pageMeta.name}
                        </span>
                        <span className="text-foreground/60 block max-w-xs truncate text-xs">
                          {pageMeta.description}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="bg-page-background border-border text-foreground/80 rounded border px-1.5 py-0.5 font-mono text-xs">
                          {pageMeta.path}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {hasCustomTitle ? (
                          <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300">
                            Custom set
                          </span>
                        ) : (
                          <span className="bg-muted/30 text-foreground/60 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                            Generated default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasCustomDesc ? (
                          <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300">
                            Custom set
                          </span>
                        ) : (
                          <span className="bg-muted/30 text-foreground/60 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                            Generated default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isNoindex ? (
                          <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                            noindex
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            index
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPage(pageMeta)}
                        >
                          Edit SEO
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border-border bg-surface max-w-4xl rounded-lg border p-6 shadow-xs">
          <SeoSettingsForm
            initialValues={initialSettings.seo}
            mediaMap={mediaMap}
            onMediaMapUpdate={handleMediaMapUpdate}
          />
        </div>
      )}

      {/* Edit Static Page SEO Dialog */}
      {editingPage && (
        <StaticPageEditDialog
          pageMeta={editingPage}
          existingRecord={
            staticPages.find((p) => p.path === editingPage.path) || null
          }
          onClose={() => setEditingPage(null)}
          onSaved={(row) => {
            handlePageSaved(row);
            setEditingPage(null);
          }}
          onMediaUpdate={handleMediaMapUpdate}
        />
      )}
    </div>
  );
}

interface StaticPageEditDialogProps {
  pageMeta: StaticPageMeta;
  existingRecord: StaticPageSeoRowWithMedia | null;
  onClose: () => void;
  onSaved: (row: StaticPageSeoRowWithMedia) => void;
  onMediaUpdate: (item: MediaItem) => void;
}

function StaticPageEditDialog({
  pageMeta,
  existingRecord,
  onClose,
  onSaved,
  onMediaUpdate,
}: StaticPageEditDialogProps) {
  const [seoTitle, setSeoTitle] = React.useState(existingRecord?.title || "");
  const [seoDescription, setSeoDescription] = React.useState(
    existingRecord?.description || ""
  );
  const [seoSocialMedia, setSeoSocialMedia] = React.useState<MediaItem | null>(
    existingRecord?.social_image || null
  );
  const [canonicalUrl, setCanonicalUrl] = React.useState(
    existingRecord?.canonical_url || ""
  );
  const [noindex, setNoindex] = React.useState(
    Boolean(existingRecord?.noindex)
  );
  const [focusKeyword, setFocusKeyword] = React.useState(
    existingRecord?.focus_keyword || ""
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const fallbackTitle = `${pageMeta.name} | Nandhini Makeup & Jewellery`;
  const fallbackDescription = pageMeta.description;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveStaticPageSeo({
        path: pageMeta.path,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_social_image_id: seoSocialMedia?.id || null,
        canonical_url: canonicalUrl.trim() || null,
        noindex,
        focus_keyword: focusKeyword.trim() || null,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save SEO settings");
        return;
      }

      toast.success(`SEO settings saved for ${pageMeta.name}`);
      const updatedRow: StaticPageSeoRowWithMedia = {
        ...res.data,
        social_image: seoSocialMedia,
      };
      if (seoSocialMedia) {
        onMediaUpdate(seoSocialMedia);
      }
      onSaved(updatedRow);
    } catch {
      toast.error("An unexpected error occurred while saving SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="border-border bg-surface my-8 max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-lg border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-heading text-foreground text-xl font-semibold">
              Edit SEO: {pageMeta.name}
            </h2>
            <p className="text-foreground/60 mt-0.5 text-xs">
              Path: <code className="font-mono">{pageMeta.path}</code>
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SeoPanel
            seoTitle={seoTitle}
            onSeoTitleChange={setSeoTitle}
            seoDescription={seoDescription}
            onSeoDescriptionChange={setSeoDescription}
            seoSocialImageId={seoSocialMedia?.id || null}
            onSeoSocialImageChange={(id, item) => {
              setSeoSocialMedia(item || null);
            }}
            socialImageMedia={seoSocialMedia}
            noindex={noindex}
            onNoindexChange={setNoindex}
            focusKeyword={focusKeyword}
            onFocusKeywordChange={setFocusKeyword}
            showCanonicalUrl={true}
            canonicalUrl={canonicalUrl}
            onCanonicalUrlChange={setCanonicalUrl}
            context={{
              slug: pageMeta.path.replace(/^\//, "") || "home",
              pathPrefix: "",
              generatedTitle: fallbackTitle,
              generatedDescription: fallbackDescription,
              featuredImage: seoSocialMedia
                ? {
                    storagePath: seoSocialMedia.storage_path,
                    altText: seoSocialMedia.alt_text,
                  }
                : null,
            }}
          />

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
              {isSaving ? "Saving..." : "Save SEO Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
