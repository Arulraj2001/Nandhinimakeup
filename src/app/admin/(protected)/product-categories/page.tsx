import type { Metadata } from "next";
import { connection } from "next/server";
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

export const instant = false;

export default async function ProductCategoriesPage() {
  await connection();
  const res = await getProductCategories();
  const categories = res.success ? res.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Product Categories"
        description="Organize jewellery and accessories collections, cover media, and navigation hierarchy."
      />
      <ProductCategoriesClient initialCategories={categories} />
    </div>
  );
}
