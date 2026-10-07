import type { Metadata } from "next";
import { getProductCategories } from "@/lib/actions/product-categories";
import { PageHeader } from "@/components/admin/page-header";
import { ProductCategoriesClient } from "./product-categories-client";

export const metadata: Metadata = {
  title: "Product Categories | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProductCategoriesPage() {
  const res = await getProductCategories();
  const categories = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        description="Organize jewellery and accessories collections, cover media, and navigation hierarchy."
      />
      <ProductCategoriesClient initialCategories={categories} />
    </div>
  );
}
