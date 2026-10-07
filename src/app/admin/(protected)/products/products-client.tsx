/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  getProducts,
  deleteProduct,
  duplicateProduct,
  bulkPublishProducts,
  bulkUnpublishProducts,
  bulkMarkOutOfStock,
  bulkDeleteProducts,
  type ProductWithDetails,
} from "@/lib/actions/products";
import { type ProductCategory } from "@/types/product-categories";
import { formatINR } from "@/lib/utils/currency";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ProductEditDialog } from "@/components/admin/product-edit-dialog";
import { getPublicMediaUrl } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";

interface ProductsClientProps {
  initialProducts: ProductWithDetails[];
  initialCategories: ProductCategory[];
}

export function ProductsClient({
  initialProducts,
  initialCategories,
}: ProductsClientProps) {
  const [products, setProducts] =
    React.useState<ProductWithDetails[]>(initialProducts);
  const [categories] = React.useState<ProductCategory[]>(initialCategories);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    React.useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    React.useState<string>("all");
  const [selectedStockFilter, setSelectedStockFilter] =
    React.useState<string>("all");

  // Modals
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] =
    React.useState<ProductWithDetails | null>(null);

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id?: string;
    name: string;
    isBulk?: boolean;
    ids?: string[];
  } | null>(null);

  const refreshProducts = async () => {
    const res = await getProducts();
    if (res.success) {
      setProducts(res.data);
    }
  };

  const handleDuplicate = async (product: ProductWithDetails) => {
    const res = await duplicateProduct(product.id);
    if (!res.success) {
      toast.error(res.error || "Failed to duplicate product");
      return;
    }
    toast.success(`Duplicated "${product.name}" as an unpublished copy.`);
    await refreshProducts();
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.isBulk && deleteConfirm.ids) {
      const res = await bulkDeleteProducts(deleteConfirm.ids);
      if (!res.success) {
        toast.error(res.error || "Failed to delete selected products");
        return;
      }
      toast.success("Selected products deleted successfully");
      const idsSet = new Set(deleteConfirm.ids);
      setProducts((prev) => prev.filter((p) => !idsSet.has(p.id)));
    } else if (deleteConfirm.id) {
      const res = await deleteProduct(deleteConfirm.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete product");
        return;
      }
      toast.success("Product deleted successfully");
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  // Bulk actions handlers
  const handleBulkPublish = async (selected: ProductWithDetails[]) => {
    const ids = selected.map((p) => p.id);
    const res = await bulkPublishProducts(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to publish products");
      return;
    }
    if (res.data.rejectedCount > 0) {
      toast.warning(
        `Published ${res.data.publishedCount} products. ${res.data.rejectedCount} products could not be published because they lack images.`
      );
    } else {
      toast.success(`Published ${res.data.publishedCount} products`);
    }
    await refreshProducts();
  };

  const handleBulkUnpublish = async (selected: ProductWithDetails[]) => {
    const ids = selected.map((p) => p.id);
    const res = await bulkUnpublishProducts(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to unpublish products");
      return;
    }
    toast.success(`Unpublished ${ids.length} products`);
    await refreshProducts();
  };

  const handleBulkOutOfStock = async (selected: ProductWithDetails[]) => {
    const ids = selected.map((p) => p.id);
    const res = await bulkMarkOutOfStock(ids);
    if (!res.success) {
      toast.error(res.error || "Failed to update products stock status");
      return;
    }
    toast.success(`Marked ${ids.length} products as out of stock`);
    await refreshProducts();
  };

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (
        selectedCategoryFilter !== "all" &&
        p.category_id !== selectedCategoryFilter
      ) {
        return false;
      }
      if (selectedStatusFilter === "published" && !p.is_published) {
        return false;
      }
      if (selectedStatusFilter === "unpublished" && p.is_published) {
        return false;
      }
      if (
        selectedStockFilter !== "all" &&
        p.stock_status !== selectedStockFilter
      ) {
        return false;
      }
      return true;
    });
  }, [
    products,
    selectedCategoryFilter,
    selectedStatusFilter,
    selectedStockFilter,
  ]);

  // Columns definition
  const columns = React.useMemo<ColumnDef<ProductWithDetails>[]>(
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
        header: "Image",
        cell: ({ row }) => {
          const item = row.original;
          const primaryImage = item.images?.[0]?.media;
          return primaryImage ? (
            <img
              src={getPublicMediaUrl(primaryImage.storage_path)}
              alt={primaryImage.alt_text}
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
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="text-foreground font-medium">{item.name}</p>
              <div className="text-foreground/60 flex items-center gap-2 text-xs">
                <span>{item.slug}</span>
                {item.sku && (
                  <span className="bg-muted py-0.2 rounded px-1.5">
                    SKU: {item.sku}
                  </span>
                )}
              </div>
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
              {cat?.name || "Uncategorized"}
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
          const item = row.original;
          const reg = Number(item.price);
          const sale =
            item.sale_price !== null && item.sale_price !== undefined
              ? Number(item.sale_price)
              : null;

          return (
            <div>
              {sale !== null ? (
                <div className="flex flex-col">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(sale)}
                  </span>
                  <span className="text-foreground/50 text-xs line-through">
                    {formatINR(reg)}
                  </span>
                </div>
              ) : (
                <span className="text-foreground font-medium">
                  {formatINR(reg)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "stock_status",
        header: "Stock",
        cell: ({ row }) => {
          const item = row.original;
          let label = "In Stock";
          let color =
            "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";

          if (item.stock_status === "out_of_stock") {
            label = "Out of Stock";
            color = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
          } else if (item.stock_status === "made_to_order") {
            label = "Made to Order";
            color =
              "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
          }

          return (
            <div className="space-y-0.5">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}
              >
                {label}
              </span>
              {item.stock_quantity !== null && (
                <p className="text-foreground/60 text-[11px]">
                  Qty: {item.stock_quantity}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "is_published",
        header: "Status",
        cell: ({ row }) => {
          const isPub = row.original.is_published;
          return (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                isPub
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {isPub ? "Published" : "Draft"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingProduct(item);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDuplicate(item)}
                title="Duplicate product"
              >
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDeleteConfirm({
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
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Top Bar with Filters & Action */}
      <div className="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex items-center gap-2">
            <span className="text-foreground/70 text-xs font-medium">
              Stock:
            </span>
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="made_to_order">Made to Order</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => {
            if (categories.length === 0) {
              toast.error(
                "Please create at least one product category before adding products."
              );
              return;
            }
            setEditingProduct(null);
            setEditDialogOpen(true);
          }}
        >
          Add Product
        </Button>
      </div>

      {/* TanStack Table with Selection & Bulk Actions */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search products by name, description, SKU..."
        emptyMessage="No products match your filter criteria."
        emptyAction={
          <Button
            onClick={() => {
              setEditingProduct(null);
              setEditDialogOpen(true);
            }}
          >
            Create First Product
          </Button>
        }
        bulkActions={(selectedRows) => (
          <div className="bg-muted flex flex-wrap items-center gap-2 rounded-md p-2">
            <span className="text-foreground px-2 text-xs font-medium">
              {selectedRows.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkPublish(selectedRows)}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkUnpublish(selectedRows)}
            >
              Unpublish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkOutOfStock(selectedRows)}
            >
              Mark Out of Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => {
                setDeleteConfirm({
                  isBulk: true,
                  ids: selectedRows.map((p) => p.id),
                  name: `${selectedRows.length} selected products`,
                });
              }}
            >
              Delete Selected
            </Button>
          </div>
        )}
      />

      <ProductEditDialog
        open={editDialogOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={refreshProducts}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        title={deleteConfirm?.isBulk ? "Delete Products" : "Delete Product"}
        itemName={deleteConfirm?.name || ""}
        message="Are you sure you want to permanently delete? Product media images will remain safe in the media library."
        confirmLabel="Delete"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
