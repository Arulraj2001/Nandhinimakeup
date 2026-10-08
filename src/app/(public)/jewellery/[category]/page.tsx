import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProductCategoryBySlug } from "@/lib/data/product-categories";
import { getPublicProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/public/product-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumb } from "@/components/public/breadcrumb";

interface CategoryListingPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

import { buildMetadata } from "@/lib/seo/metadata-builder";
import { handleRedirectOrNotFound } from "@/lib/utils/redirects";
import {
  JsonLdScript,
  buildBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";
import { env } from "@/lib/config/env";

export async function generateMetadata({
  params,
  searchParams,
}: CategoryListingPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const sp = await searchParams;
  const [category, productsData] = await Promise.all([
    getPublicProductCategoryBySlug(categorySlug),
    getPublicProducts({ categorySlug, limit: 1 }),
  ]);

  if (!category) {
    return buildMetadata({
      path: `/jewellery/${categorySlug}`,
      forceNoIndex: true,
      generated: {
        title: "Category Not Found",
      },
    });
  }

  return buildMetadata({
    path: `/jewellery/${categorySlug}`,
    searchParams: sp,
    hasItems: productsData.total > 0,
    entity: {
      seo_title: category.seo_title,
      seo_description: category.seo_description,
      seo_social_image_id: category.seo_social_image_id,
      noindex: category.noindex,
    },
    generated: {
      title: `${category.name} Jewellery`,
      description:
        category.description || `Browse handcrafted ${category.name} pieces.`,
    },
  });
}

async function CategoryListingContent({
  params,
  searchParams,
}: CategoryListingPageProps) {
  const { category: categorySlug } = await params;
  const resolvedParams = await searchParams;

  const category = await getPublicProductCategoryBySlug(categorySlug);
  if (!category) {
    await handleRedirectOrNotFound(`/jewellery/${categorySlug}`);
    notFound();
  }

  const sort =
    resolvedParams.sort === "price_asc" || resolvedParams.sort === "price_desc"
      ? resolvedParams.sort
      : "newest";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const productsResult = await getPublicProducts({
    categorySlug,
    sort,
    page,
    limit: 12,
  });

  const breadcrumbSchema = buildBreadcrumbStructuredData(
    [
      { label: "Home", href: "/" },
      { label: "Jewellery", href: "/jewellery" },
      { label: category.name, href: `/jewellery/${category.slug}` },
    ],
    env.NEXT_PUBLIC_SITE_URL
  );

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <JsonLdScript data={breadcrumbSchema} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Jewellery", href: "/jewellery" },
            { label: category.name },
          ]}
        />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Jewellery Category
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
              {category.description}
            </p>
          )}
        </div>

        {/* Products Section */}
        <section className="space-y-6">
          <div className="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-wide">
              {category.name} ({productsResult.total})
            </h2>

            {/* Sort Options via URL Parameters */}
            <div className="flex items-center gap-2">
              <span className="text-foreground/70 text-xs font-medium">
                Sort by:
              </span>
              <div className="flex items-center gap-1 text-xs">
                <Link
                  href={`/jewellery/${categorySlug}?sort=newest&page=1`}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    sort === "newest"
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground hover:bg-accent"
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={`/jewellery/${categorySlug}?sort=price_asc&page=1`}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    sort === "price_asc"
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground hover:bg-accent"
                  }`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={`/jewellery/${categorySlug}?sort=price_desc&page=1`}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    sort === "price_desc"
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground hover:bg-accent"
                  }`}
                >
                  Price: High to Low
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid or Empty State */}
          {productsResult.products.length === 0 ? (
            <EmptyState
              message={`No products currently available in ${category.name}.`}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                {productsResult.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <Pagination
                currentPage={productsResult.currentPage}
                totalPages={productsResult.totalPages}
                baseUrl={`/jewellery/${categorySlug}`}
                searchParams={{ sort }}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CategoryListingPage({
  params,
  searchParams,
}: CategoryListingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 flex min-h-[400px] items-center justify-center text-sm">
          Loading category...
        </div>
      }
    >
      <CategoryListingContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
