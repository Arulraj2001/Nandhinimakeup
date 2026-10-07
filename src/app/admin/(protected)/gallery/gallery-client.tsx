/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getGalleryItems,
  deleteGalleryItem,
  toggleGalleryItemPublished,
  toggleGalleryItemFeatured,
  reorderGalleryItems,
  bulkPublishGalleryItems,
  bulkUnpublishGalleryItems,
  bulkDeleteGalleryItems,
  type GalleryItemWithDetails,
} from "@/lib/actions/gallery";
import type { ServiceCategory } from "@/types/services";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { GalleryItemDialog } from "@/components/admin/gallery-item-dialog";
import { getPublicMediaUrl } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";

interface GalleryClientProps {
  initialItems: GalleryItemWithDetails[];
  categories: ServiceCategory[];
}

export function GalleryClient({
  initialItems,
  categories,
}: GalleryClientProps) {
  const [items, setItems] =
    React.useState<GalleryItemWithDetails[]>(initialItems);

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] =
    React.useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    React.useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    React.useState<string>("all");

  // Reorder mode
  const [reorderMode, setReorderMode] = React.useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] =
    React.useState<GalleryItemWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id?: string;
    title: string;
    isBulk?: boolean;
    ids?: string[];
  } | null>(null);

  const refreshItems = async () => {
    const res = await getGalleryItems();
    if (res.success) {
      setItems(res.data);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.isBulk && deleteConfirm.ids) {
      const res = await bulkDeleteGalleryItems(deleteConfirm.ids);
      if (!res.success) {
        toast.error(res.error || "Failed to delete selected items");
        return;
      }
      toast.success("Selected items deleted successfully");
      const idsSet = new Set(deleteConfirm.ids);
      setItems((prev) => prev.filter((item) => !idsSet.has(item.id)));
    } else if (deleteConfirm.id) {
      const res = await deleteGalleryItem(deleteConfirm.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete gallery item");
        return;
      }
      toast.success("Gallery item deleted successfully");
      setItems((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
    }

    setDeleteConfirm(null);
  };

  // Bulk actions handlers
  const handleBulkPublish = async (selected: GalleryItemWithDetails[]) => {
    const ids = selected.map((item) => item.id);
    const res = await bulkPublishGalleryItems(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to publish items");
      return;
    }
    toast.success(`Published ${ids.length} items`);
    await refreshItems();
  };

  const handleBulkUnpublish = async (selected: GalleryItemWithDetails[]) => {
    const ids = selected.map((item) => item.id);
    const res = await bulkUnpublishGalleryItems(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to unpublish items");
      return;
    }
    toast.success(`Unpublished ${ids.length} items`);
    await refreshItems();
  };

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (selectedTypeFilter !== "all" && item.type !== selectedTypeFilter) {
        return false;
      }
      if (
        selectedCategoryFilter !== "all" &&
        item.service_category_id !== selectedCategoryFilter
      ) {
        return false;
      }
      if (selectedStatusFilter === "published" && !item.is_published) {
        return false;
      }
      if (selectedStatusFilter === "unpublished" && item.is_published) {
        return false;
      }
      return true;
    });
  }, [items, selectedTypeFilter, selectedCategoryFilter, selectedStatusFilter]);

  // Columns definition
  const columns = React.useMemo<ColumnDef<GalleryItemWithDetails>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            aria-label="Select all"
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            aria-label="Select row"
            className="rounded border-gray-300"
          />
        ),
        enableSorting: false,
      },
      {
        id: "thumbnail",
        header: "Preview",
        cell: ({ row }) => {
          const item = row.original;
          if (item.type === "before_after" && item.before_media) {
            return (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <img
                    src={getPublicMediaUrl(item.before_media.storage_path)}
                    alt={item.before_media.alt_text || "Before"}
                    className="h-10 w-10 rounded border bg-white object-cover"
                  />
                  <span className="bg-background text-foreground/80 py-0.2 absolute -top-1 -left-1 rounded border px-1 text-[8px] font-semibold">
                    B
                  </span>
                </div>
                <span className="text-foreground/40 text-xs">→</span>
                <div className="relative">
                  <img
                    src={
                      item.media
                        ? getPublicMediaUrl(item.media.storage_path)
                        : ""
                    }
                    alt={item.media?.alt_text || "After"}
                    className="h-10 w-10 rounded border bg-white object-cover"
                  />
                  <span className="bg-background text-foreground/80 py-0.2 absolute -top-1 -left-1 rounded border px-1 text-[8px] font-semibold">
                    A
                  </span>
                </div>
              </div>
            );
          }

          return item.media ? (
            <img
              src={getPublicMediaUrl(item.media.storage_path)}
              alt={item.media.alt_text || "Gallery image"}
              className="h-10 w-10 rounded border bg-white object-cover"
            />
          ) : (
            <div className="bg-muted text-foreground/50 flex h-10 w-10 items-center justify-center rounded border text-[10px]">
              No img
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Details",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="text-foreground font-medium">
                {item.title || (
                  <span className="text-foreground/50 italic">Untitled</span>
                )}
              </p>
              {item.caption && (
                <p className="text-foreground/60 line-clamp-1 text-xs">
                  {item.caption}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const isBeforeAfter = row.original.type === "before_after";
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                isBeforeAfter
                  ? "bg-accent/20 text-foreground border-accent/40 border"
                  : "bg-surface text-foreground border"
              }`}
            >
              {isBeforeAfter ? "Before & After" : "Single"}
            </span>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.service_category;
          return (
            <span className="text-foreground/80 text-xs">
              {cat ? cat.name : "None"}
            </span>
          );
        },
      },
      {
        accessorKey: "is_featured",
        header: "Featured",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button
              type="button"
              onClick={async () => {
                const next = !item.is_featured;
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, is_featured: next } : i
                  )
                );
                const res = await toggleGalleryItemFeatured(item.id, next);
                if (!res.success) {
                  toast.error(res.error || "Failed to update featured status");
                  await refreshItems();
                } else {
                  toast.success(
                    next ? "Marked as featured" : "Removed from featured"
                  );
                }
              }}
              className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                item.is_featured
                  ? "bg-accent text-foreground font-semibold"
                  : "bg-surface text-foreground/60 hover:bg-surface/80 border"
              }`}
            >
              {item.is_featured ? "Featured" : "No"}
            </button>
          );
        },
      },
      {
        accessorKey: "is_published",
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button
              type="button"
              onClick={async () => {
                const next = !item.is_published;
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, is_published: next } : i
                  )
                );
                const res = await toggleGalleryItemPublished(item.id, next);
                if (!res.success) {
                  toast.error(res.error || "Failed to update status");
                  await refreshItems();
                } else {
                  toast.success(next ? "Published item" : "Unpublished item");
                }
              }}
              className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                item.is_published
                  ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                  : "bg-surface text-foreground/60 border"
              }`}
            >
              {item.is_published ? "Published" : "Draft"}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingItem(item);
                  setDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                onClick={() => {
                  setDeleteConfirm({
                    id: item.id,
                    title: item.title || "this gallery item",
                  });
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Action and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-foreground/70 text-xs font-medium">
              Type:
            </span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
            >
              <option value="all">All Types</option>
              <option value="single">Single Image</option>
              <option value="before_after">Before & After</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground/70 text-xs font-medium">
              Category:
            </span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground/70 text-xs font-medium">
              Status:
            </span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Draft</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setReorderMode(!reorderMode)}
          >
            {reorderMode ? "Exit Reorder Mode" : "Reorder Mode"}
          </Button>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
        >
          Add Gallery Item
        </Button>
      </div>

      {/* Main Content: Reorder Mode or DataTable */}
      {reorderMode ? (
        <GalleryReorderList
          key={filteredItems.map((i) => i.id).join("-")}
          items={filteredItems}
          onReordered={async (reordered) => {
            setItems(reordered);
            const ids = reordered.map((item) => item.id);
            const res = await reorderGalleryItems(ids);
            if (!res.success) {
              toast.error(res.error || "Failed to persist gallery order");
            } else {
              toast.success("Gallery order updated");
            }
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredItems}
          searchPlaceholder="Search gallery by title or caption..."
          emptyMessage="No gallery items found."
          emptyAction={
            <Button
              onClick={() => {
                setEditingItem(null);
                setDialogOpen(true);
              }}
            >
              Add First Gallery Item
            </Button>
          }
          bulkActions={(selected) => (
            <div className="flex items-center gap-2">
              <span className="text-foreground/70 text-sm font-medium">
                {selected.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkPublish(selected)}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUnpublish(selected)}
              >
                Unpublish
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  setDeleteConfirm({
                    isBulk: true,
                    ids: selected.map((i) => i.id),
                    title: `${selected.length} selected items`,
                  });
                }}
              >
                Delete
              </Button>
            </div>
          )}
        />
      )}

      {/* Add / Edit Dialog */}
      <GalleryItemDialog
        open={dialogOpen}
        item={editingItem}
        categories={categories}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        onSuccess={async () => {
          setDialogOpen(false);
          setEditingItem(null);
          await refreshItems();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Confirm Delete"
        itemName={deleteConfirm?.title || ""}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// Drag & Drop Reordering Component
function GalleryReorderList({
  items,
  onReordered,
}: {
  items: GalleryItemWithDetails[];
  onReordered: (items: GalleryItemWithDetails[]) => void;
}) {
  const [list, setList] = React.useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(list, oldIndex, newIndex);
    setList(reordered);
    onReordered(reordered);
  };

  return (
    <div className="border-border bg-page-background space-y-3 rounded-lg border p-4">
      <p className="text-foreground/70 text-xs font-medium">
        Drag items by their handle to change their showcase order. Changes are
        saved automatically.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={list.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {list.map((item) => (
              <SortableGalleryRow key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableGalleryRow({ item }: { item: GalleryItemWithDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border-border flex items-center justify-between rounded-md border p-3"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
          className="text-foreground/40 hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        {item.type === "before_after" && item.before_media ? (
          <div className="flex items-center gap-1">
            <img
              src={getPublicMediaUrl(item.before_media.storage_path)}
              alt="Before"
              className="h-9 w-9 rounded border object-cover"
            />
            <span className="text-foreground/40 text-xs">→</span>
            <img
              src={item.media ? getPublicMediaUrl(item.media.storage_path) : ""}
              alt="After"
              className="h-9 w-9 rounded border object-cover"
            />
          </div>
        ) : item.media ? (
          <img
            src={getPublicMediaUrl(item.media.storage_path)}
            alt={item.media.alt_text || "Thumb"}
            className="h-9 w-9 rounded border object-cover"
          />
        ) : (
          <div className="bg-muted flex h-9 w-9 items-center justify-center rounded text-[10px]">
            No img
          </div>
        )}

        <div>
          <p className="text-foreground text-sm font-medium">
            {item.title || "Untitled"}
          </p>
          <p className="text-foreground/60 text-xs">
            {item.type === "before_after" ? "Before & After" : "Single image"}
            {item.service_category ? ` • ${item.service_category.name}` : ""}
          </p>
        </div>
      </div>

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          item.is_published
            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
            : "bg-surface text-foreground/50 border"
        }`}
      >
        {item.is_published ? "Published" : "Draft"}
      </span>
    </div>
  );
}
