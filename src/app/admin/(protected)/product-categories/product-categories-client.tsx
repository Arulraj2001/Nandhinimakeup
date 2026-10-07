/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
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
  getProductCategories,
  deleteProductCategory,
  toggleProductCategoryPublished,
  reorderProductCategories,
  type ProductCategoryWithImage,
} from "@/lib/actions/product-categories";
import { ProductCategoryDialog } from "@/components/admin/product-category-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getPublicMediaUrl } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";

interface ProductCategoriesClientProps {
  initialCategories: ProductCategoryWithImage[];
}

export function ProductCategoriesClient({
  initialCategories,
}: ProductCategoriesClientProps) {
  const [categories, setCategories] =
    React.useState<ProductCategoryWithImage[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<ProductCategoryWithImage | null>(null);
  const [deleteConfirm, setDeleteConfirm] =
    React.useState<ProductCategoryWithImage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const refreshCategories = async () => {
    const res = await getProductCategories();
    if (res.success) {
      setCategories(res.data);
    }
  };

  const handleTogglePublish = async (cat: ProductCategoryWithImage) => {
    const nextState = !cat.is_published;
    const res = await toggleProductCategoryPublished(cat.id, nextState);
    if (!res.success) {
      toast.error(res.error || "Failed to update category status");
      return;
    }
    toast.success(`Category ${nextState ? "published" : "unpublished"}`);
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_published: nextState } : c))
    );
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    const res = await deleteProductCategory(deleteConfirm.id);
    if (!res.success) {
      toast.error(res.error || "Failed to delete category");
      return;
    }
    toast.success("Category deleted successfully");
    setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(categories, oldIndex, newIndex);
        setCategories(reordered);
        const res = await reorderProductCategories(reordered.map((c) => c.id));
        if (!res.success) {
          toast.error("Failed to persist category order");
        } else {
          toast.success("Category order updated");
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-border flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Product Categories ({categories.length})
          </h2>
          <p className="text-foreground/70 text-xs">
            Drag to reorder how categories appear on your store menu and
            navigation.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setDialogOpen(true);
          }}
        >
          Add Product Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="border-border rounded-lg border p-12 text-center">
          <p className="text-foreground/70 text-sm">
            No product categories created yet.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                setEditingCategory(null);
                setDialogOpen(true);
              }}
            >
              Create First Category
            </Button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <SortableProductCategoryRow
                  key={category.id}
                  category={category}
                  onEdit={() => {
                    setEditingCategory(category);
                    setDialogOpen(true);
                  }}
                  onTogglePublish={() => handleTogglePublish(category)}
                  onDelete={() => setDeleteConfirm(category)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ProductCategoryDialog
        open={dialogOpen}
        category={editingCategory}
        onClose={() => setDialogOpen(false)}
        onSuccess={refreshCategories}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Product Category"
        itemName={deleteConfirm?.name || ""}
        message="Are you sure you want to delete this product category? Categories containing products cannot be deleted."
        confirmLabel="Delete"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}

function SortableProductCategoryRow({
  category,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  category: ProductCategoryWithImage;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-card flex items-center justify-between rounded-lg border p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-foreground/50 hover:text-foreground cursor-grab touch-none p-1 text-lg"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        {category.image ? (
          <img
            src={getPublicMediaUrl(category.image.storage_path)}
            alt={category.image.alt_text}
            className="h-10 w-10 rounded border bg-white object-cover"
          />
        ) : (
          <div className="bg-muted text-foreground/50 flex h-10 w-10 items-center justify-center rounded border text-xs">
            No img
          </div>
        )}

        <div>
          <p className="text-foreground text-sm font-semibold">
            {category.name}
          </p>
          <p className="text-foreground/60 text-xs">{category.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePublish}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            category.is_published
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          {category.is_published ? "Published" : "Draft"}
        </button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
