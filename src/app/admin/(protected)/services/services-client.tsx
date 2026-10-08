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
  getServices,
  getServiceCategories,
  deleteService,
  deleteServiceCategory,
  toggleServicePublished,
  toggleServiceFeatured,
  toggleServiceCategoryPublished,
  reorderServiceCategories,
  reorderServices,
} from "@/lib/actions/services";
import {
  type ServiceWithCategory,
  type ServiceCategory,
} from "@/types/services";
import { formatINR } from "@/lib/utils/currency";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ServiceCategoryDialog } from "@/components/admin/service-category-dialog";
import { ServiceEditDialog } from "@/components/admin/service-edit-dialog";
import { getPublicMediaUrl } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";

interface ServicesClientProps {
  initialServices: ServiceWithCategory[];
  initialCategories: ServiceCategory[];
}

export function ServicesClient({
  initialServices,
  initialCategories,
}: ServicesClientProps) {
  const [activeTab, setActiveTab] = React.useState<"services" | "categories">(
    "services"
  );
  const [services, setServices] =
    React.useState<ServiceWithCategory[]>(initialServices);
  const [categories, setCategories] =
    React.useState<ServiceCategory[]>(initialCategories);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    React.useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    React.useState<string>("all");

  // Modals
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<ServiceCategory | null>(null);

  const [serviceDialogOpen, setServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] =
    React.useState<ServiceWithCategory | null>(null);

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: "service" | "category";
    id: string;
    name: string;
  } | null>(null);

  const [reorderCategoryMode, setReorderCategoryMode] = React.useState(false);

  // Refresh helpers
  const refreshServices = async () => {
    const res = await getServices();
    if (res.success) {
      setServices(res.data);
    }
  };

  const refreshCategories = async () => {
    const res = await getServiceCategories();
    if (res.success) {
      setCategories(res.data);
    }
  };

  // Service actions
  const handleToggleServicePublish = async (service: ServiceWithCategory) => {
    const nextState = !service.is_published;
    const res = await toggleServicePublished(service.id, nextState);
    if (!res.success) {
      toast.error(res.error || "Failed to update status");
      return;
    }
    toast.success(`Service ${nextState ? "published" : "unpublished"}`);
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_published: nextState } : s
      )
    );
  };

  const handleToggleServiceFeatured = async (service: ServiceWithCategory) => {
    const nextState = !service.is_featured;
    const res = await toggleServiceFeatured(service.id, nextState);
    if (!res.success) {
      toast.error(res.error || "Failed to update featured status");
      return;
    }
    toast.success(`Service ${nextState ? "marked as featured" : "unfeatured"}`);
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_featured: nextState } : s
      )
    );
  };

  // Category actions
  const handleToggleCategoryPublish = async (category: ServiceCategory) => {
    const nextState = !category.is_published;
    const res = await toggleServiceCategoryPublished(category.id, nextState);
    if (!res.success) {
      toast.error(res.error || "Failed to update category status");
      return;
    }
    toast.success(`Category ${nextState ? "published" : "unpublished"}`);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, is_published: nextState } : c
      )
    );
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "service") {
      const res = await deleteService(deleteConfirm.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete service");
        return;
      }
      toast.success("Service deleted successfully");
      setServices((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
    } else {
      const res = await deleteServiceCategory(deleteConfirm.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete category");
        return;
      }
      toast.success("Category deleted successfully");
      setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  // Filtered services
  const filteredServices = React.useMemo(() => {
    return services.filter((s) => {
      if (
        selectedCategoryFilter !== "all" &&
        s.category_id !== selectedCategoryFilter
      ) {
        return false;
      }
      if (selectedStatusFilter === "published" && !s.is_published) {
        return false;
      }
      if (selectedStatusFilter === "unpublished" && s.is_published) {
        return false;
      }
      return true;
    });
  }, [services, selectedCategoryFilter, selectedStatusFilter]);

  // Table columns
  const serviceColumns = React.useMemo<ColumnDef<ServiceWithCategory>[]>(
    () => [
      {
        id: "image",
        header: "Image",
        cell: ({ row }) => {
          const item = row.original;
          return item.image ? (
            <img
              src={getPublicMediaUrl(item.image.storage_path)}
              alt={item.image.alt_text}
              className="h-10 w-10 rounded border bg-white object-cover"
            />
          ) : (
            <div className="bg-muted text-foreground/50 flex h-10 w-10 items-center justify-center rounded border text-xs">
              No img
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Service",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="text-foreground font-medium">{item.name}</p>
              <p className="text-foreground/60 text-xs">{item.slug}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.category;
          return (
            <span className="bg-muted text-foreground rounded px-2 py-0.5 text-xs font-medium">
              {cat?.name || "Unassigned"}
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
          const item = row.original;
          if (item.price_type === "on_request") {
            return (
              <span className="text-foreground/70 text-xs">On Request</span>
            );
          }
          const formatted =
            item.price !== null ? formatINR(Number(item.price)) : "-";
          return (
            <span className="text-foreground text-sm font-medium">
              {item.price_type === "starting_from"
                ? `From ${formatted}`
                : formatted}
            </span>
          );
        },
      },
      {
        accessorKey: "duration_minutes",
        header: "Duration",
        cell: ({ row }) => {
          const mins = row.original.duration_minutes;
          return mins ? `${mins} mins` : "-";
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
              onClick={() => handleToggleServiceFeatured(item)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                item.is_featured
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-muted text-foreground/60 hover:text-foreground"
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
              onClick={() => handleToggleServicePublish(item)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                item.is_published
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
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
                  setEditingService(item);
                  setServiceDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDeleteConfirm({
                    type: "service",
                    id: item.id,
                    name: item.name,
                  })
                }
                className="text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services]
  );

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs & Primary Actions */}
      <div className="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "services" ? "default" : "outline"}
            onClick={() => setActiveTab("services")}
          >
            Services ({services.length})
          </Button>
          <Button
            variant={activeTab === "categories" ? "default" : "outline"}
            onClick={() => setActiveTab("categories")}
          >
            Categories ({categories.length})
          </Button>
        </div>

        <div className="flex gap-2">
          {activeTab === "services" ? (
            <Button
              onClick={() => {
                if (categories.length === 0) {
                  toast.error("Please create at least one category first.");
                  setActiveTab("categories");
                  setEditingCategory(null);
                  setCategoryDialogOpen(true);
                  return;
                }
                setEditingService(null);
                setServiceDialogOpen(true);
              }}
            >
              Add Service
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Services Tab Content */}
      {activeTab === "services" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4">
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                <option value="unpublished">Draft / Unpublished</option>
              </select>
            </div>

            {selectedCategoryFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReorderCategoryMode(!reorderCategoryMode)}
              >
                {reorderCategoryMode
                  ? "Exit Reorder Mode"
                  : "Reorder Services in Category"}
              </Button>
            )}
          </div>

          {reorderCategoryMode && selectedCategoryFilter !== "all" ? (
            <ServicesReorderList
              categoryId={selectedCategoryFilter}
              services={filteredServices}
              onReordered={async (reordered) => {
                setServices((prev) => {
                  const others = prev.filter(
                    (s) => s.category_id !== selectedCategoryFilter
                  );
                  return [...others, ...reordered];
                });
                const ids = reordered.map((s) => s.id);
                const res = await reorderServices(ids);
                if (!res.success) {
                  toast.error("Failed to persist services order");
                } else {
                  toast.success("Services order updated");
                }
              }}
            />
          ) : (
            <DataTable
              columns={serviceColumns}
              data={filteredServices}
              searchPlaceholder="Search services by name or description..."
              emptyAction={
                <Button
                  onClick={() => {
                    setEditingService(null);
                    setServiceDialogOpen(true);
                  }}
                >
                  Create First Service
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Categories Tab Content */}
      {activeTab === "categories" && (
        <CategoriesList
          categories={categories}
          onCategoriesChange={setCategories}
          onEditCategory={(c) => {
            setEditingCategory(c);
            setCategoryDialogOpen(true);
          }}
          onTogglePublish={handleToggleCategoryPublish}
          onDeleteCategory={(c) => {
            setDeleteConfirm({
              type: "category",
              id: c.id,
              name: c.name,
            });
          }}
        />
      )}

      {/* Modals & Dialogs */}
      <ServiceCategoryDialog
        open={categoryDialogOpen}
        category={editingCategory}
        onClose={() => setCategoryDialogOpen(false)}
        onSuccess={() => {
          refreshCategories();
          refreshServices();
        }}
      />

      <ServiceEditDialog
        open={serviceDialogOpen}
        service={editingService}
        categories={categories}
        onClose={() => setServiceDialogOpen(false)}
        onSuccess={refreshServices}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        title={
          deleteConfirm?.type === "service"
            ? "Delete Service"
            : "Delete Category"
        }
        itemName={deleteConfirm ? deleteConfirm.name : ""}
        message={
          deleteConfirm?.type === "service"
            ? "Are you sure you want to permanently delete this service? The associated media image will not be deleted."
            : "Are you sure you want to delete this category? Categories containing services cannot be deleted."
        }
        confirmLabel="Delete"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Drag and Drop Categories List
// ----------------------------------------------------------------------
function CategoriesList({
  categories,
  onCategoriesChange,
  onEditCategory,
  onTogglePublish,
  onDeleteCategory,
}: {
  categories: ServiceCategory[];
  onCategoriesChange: (cats: ServiceCategory[]) => void;
  onEditCategory: (c: ServiceCategory) => void;
  onTogglePublish: (c: ServiceCategory) => void;
  onDeleteCategory: (c: ServiceCategory) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(categories, oldIndex, newIndex);
        onCategoriesChange(reordered);
        const res = await reorderServiceCategories(reordered.map((c) => c.id));
        if (!res.success) {
          toast.error("Failed to persist category order");
        } else {
          toast.success("Category order updated");
        }
      }
    }
  };

  if (categories.length === 0) {
    return (
      <div className="border-border rounded-lg border p-12 text-center">
        <p className="text-foreground/70 text-sm">No service categories yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-foreground/70 text-xs">
        Drag categories to reorder them in the customer navigation and menu.
      </p>

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
              <SortableCategoryRow
                key={category.id}
                category={category}
                onEdit={() => onEditCategory(category)}
                onTogglePublish={() => onTogglePublish(category)}
                onDelete={() => onDeleteCategory(category)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategoryRow({
  category,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  category: ServiceCategory;
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
      className="border-border bg-surface flex items-center justify-between rounded-lg border p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-foreground/50 hover:text-foreground cursor-grab touch-none p-1 text-lg"
          title="Drag to reorder category"
          aria-label="Drag to reorder category"
        >
          ⠿
        </button>
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

// ----------------------------------------------------------------------
// Services Reorder Mode List
// ----------------------------------------------------------------------
function ServicesReorderList({
  services,
  onReordered,
}: {
  categoryId: string;
  services: ServiceWithCategory[];
  onReordered: (items: ServiceWithCategory[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReordered(arrayMove(services, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="border-border bg-surface space-y-3 rounded-lg border p-4">
      <p className="text-foreground/80 text-sm font-medium">
        Drag services to change their display sequence in this category:
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={services.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {services.map((service) => (
              <SortableServiceItem key={service.id} service={service} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableServiceItem({ service }: { service: ServiceWithCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-background flex items-center gap-3 rounded border p-3 text-sm shadow-xs"
    >
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
      <div className="flex-1">
        <p className="text-foreground font-medium">{service.name}</p>
        <p className="text-foreground/60 text-xs">{service.slug}</p>
      </div>
      <span className="text-foreground/70 text-xs">
        {service.price_type === "on_request"
          ? "On Request"
          : formatINR(Number(service.price) || 0)}
      </span>
    </div>
  );
}
