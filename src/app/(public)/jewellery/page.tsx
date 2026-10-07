import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicProductCategories } from "@/lib/data/product-categories";
import { getPublicProducts } from "@/lib/data/products";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { ProductCard } from "@/components/public/product-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumb } from "@/components/public/breadcrumb";

interface JewelleryPageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata({
  searchParams,
}: JewelleryPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const productsData = await getPublicProducts({ limit: 1 });

  return buildMetadata({
    path: "/jewellery",
    searchParams: sp,
    hasItems: productsData.total > 0,
    generated: {
      title: "Jewellery Collection",
      description:
        "Explore our handcrafted bridal jewellery, bespoke accessories, and traditional ornaments.",
    },
  });
}

async function JewelleryProductList({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const sort =
    resolvedParams.sort === "price_asc" || resolvedParams.sort === "price_desc"
      ? resolvedParams.sort
      : "newest";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const productsResult = await getPublicProducts({ sort, page, limit: 12 });

  return (
    <section className="space-y-6">
      <div className="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-wide">
            All Jewellery ({productsResult.total})
          </h2>
        </div>

        {/* Sort Options via URL Parameters */}
        <div className="flex items-center gap-2">
          <span className="text-foreground/70 text-xs font-medium">
            Sort by:
          </span>
          <div className="flex items-center gap-1 text-xs">
            <Link
              href={`/jewellery?sort=newest&page=1`}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                sort === "newest"
                  ? "bg-foreground text-background"
                  : "bg-surface text-foreground hover:bg-accent"
              }`}
            >
              Newest
            </Link>
            <Link
              href={`/jewellery?sort=price_asc&page=1`}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                sort === "price_asc"
                  ? "bg-foreground text-background"
                  : "bg-surface text-foreground hover:bg-accent"
              }`}
            >
              Price: Low to High
            </Link>
            <Link
              href={`/jewellery?sort=price_desc&page=1`}
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
        <EmptyState message="No jewellery pieces available matching the criteria." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productsResult.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          <Pagination
            currentPage={productsResult.currentPage}
            totalPages={productsResult.totalPages}
            baseUrl="/jewellery"
            searchParams={{ sort }}
          />
        </>
      )}
    </section>
  );
}

export default async function JewelleryPage({
  searchParams,
}: JewelleryPageProps) {
  const categories = await getPublicProductCategories();

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Jewellery" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Curated Ornaments
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Jewellery & Accessories
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Handcrafted bridal necklaces, earrings, maang tikka, and bespoke
            ornaments designed to elevate every celebratory look.
          </p>
        </div>

        {/* Product Categories Grid */}
        {categories.length > 0 && (
          <section className="mb-16 space-y-6">
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-wide">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((cat) => {
                const catImgUrl = cat.image
                  ? getPublicMediaUrl(cat.image.storage_path)
                  : null;
                return (
                  <Link
                    key={cat.id}
                    href={`/jewellery/${cat.slug}`}
                    className="border-border bg-surface group flex flex-col items-center rounded-lg border p-3 text-center transition-transform hover:-translate-y-1 hover:shadow-sm"
                  >
                    <div className="bg-page-background relative aspect-square w-full overflow-hidden rounded-md">
                      {catImgUrl ? (
                        <Image
                          src={catImgUrl}
                          alt={cat.image?.alt_text || cat.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
                          {cat.name}
                        </div>
                      )}
                    </div>
                    <span className="font-heading text-foreground mt-2 text-sm font-semibold tracking-wide group-hover:underline">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <Suspense
          fallback={
            <div className="text-foreground/40 flex min-h-[300px] items-center justify-center text-sm">
              Loading jewellery pieces...
            </div>
          }
        >
          <JewelleryProductList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
