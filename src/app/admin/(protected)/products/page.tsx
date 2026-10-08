import type { Metadata } from "next";
import { connection } from "next/server";
import { getProducts } from "@/lib/actions/products";
import { getProductCategories } from "@/lib/actions/product-categories";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsClient } from "./products-client";

export const metadata: Metadata = {
  title: "Products | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function ProductsPage() {
  await connection();
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);

  const products = productsRes.success ? productsRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Products"
        description="Manage jewellery accessories, stock availability, pricing, and showcase images."
      />
      <ProductsClient
        initialProducts={products}
        initialCategories={categories}
      />
    </div>
  );
}
