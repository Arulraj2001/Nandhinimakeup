/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  getMediaList,
  deleteMediaRecord,
  type MediaItem,
} from "@/lib/actions/media";
import { PageHeader } from "@/components/admin/page-header";
import { MediaUploadDialog } from "@/components/admin/media-upload-dialog";
import { MediaEditDialog } from "@/components/admin/media-edit-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getPublicMediaUrl } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MediaLibraryClient() {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Dialog states
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MediaItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<MediaItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void getMediaList({ search, page, pageSize: 18 }).then((res) => {
      if (!active) return;
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
      } else {
        toast.error(res.error);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [search, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    const res = await deleteMediaRecord(deletingItem.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success(`Image "${deletingItem.file_name}" deleted.`);
      setDeletingItem(null);
      reload();
    } else {
      toast.error(res.error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Media Library"
        description={`Manage images and assets (${totalCount} total)`}
        action={
          <Button onClick={() => setUploadOpen(true)}>+ Upload Images</Button>
        }
      />

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by file name or alt text..."
          className="max-w-md"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-foreground/70 flex h-64 items-center justify-center text-sm">
          Loading media library...
        </div>
      ) : items.length === 0 ? (
        <div className="border-border flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-foreground/80 text-sm">No images found.</p>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            Upload Your First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group border-border bg-card-surface hover:border-foreground/50 flex flex-col overflow-hidden rounded-lg border shadow-xs transition-all"
            >
              <div className="bg-surface relative aspect-square w-full overflow-hidden">
                <img
                  src={getPublicMediaUrl(item.storage_path)}
                  alt={item.alt_text}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between p-3 text-xs">
                <div>
                  <p
                    className="text-foreground truncate font-medium"
                    title={item.file_name}
                  >
                    {item.file_name}
                  </p>
                  <p
                    className="text-foreground/70 mt-0.5 truncate text-[11px]"
                    title={item.alt_text}
                  >
                    {item.alt_text}
                  </p>
                  <div className="text-foreground/60 mt-2 flex items-center justify-between text-[10px]">
                    <span>
                      {item.width} × {item.height}
                    </span>
                    <span>{formatSize(item.size_bytes)}</span>
                  </div>
                </div>

                <div className="border-border mt-3 flex items-center justify-end gap-1.5 border-t pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setEditingItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeletingItem(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-border text-foreground flex items-center justify-between border-t pt-4 text-xs">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <MediaUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => reload()}
      />

      <MediaEditDialog
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => reload()}
      />

      <ConfirmDialog
        open={!!deletingItem}
        title="Delete Image"
        itemName={deletingItem?.file_name || "Image"}
        message={
          deletingItem
            ? `Are you sure you want to permanently delete "${deletingItem.file_name}"? If this image is currently referenced anywhere, deletion will be blocked.`
            : undefined
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
}
