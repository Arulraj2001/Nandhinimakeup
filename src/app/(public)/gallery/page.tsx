import type { Metadata } from "next";
import Link from "next/link";
import { getPublicGalleryItems } from "@/lib/data/gallery";
import { getPublicServiceCategories } from "@/lib/data/service-categories";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumb } from "@/components/public/breadcrumb";

interface GalleryPageProps {
  searchParams: Promise<{
    category?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Portfolio & Gallery | ${settings.business.business_name}`;
  const description =
    "Explore our bridal makeup transformations, before-and-after looks, saree draping, and artistry portfolio.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const resolvedParams = await searchParams;
  const categorySlug = resolvedParams.category;
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  // Fetch service categories for the filter
  const categories = await getPublicServiceCategories();

  // Find selected category ID if a slug is provided
  let selectedCategoryId: string | undefined = undefined;
  let selectedCategoryName: string | undefined = undefined;

  if (categorySlug && categorySlug !== "all") {
    const matching = categories.find((c) => c.slug === categorySlug);
    if (matching) {
      selectedCategoryId = matching.id;
      selectedCategoryName = matching.name;
    }
  }

  // Fetch paginated gallery items (24 per page per specification)
  const galleryResult = await getPublicGalleryItems({
    categoryId: selectedCategoryId,
    page,
    limit: 24,
  });

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Gallery" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Artistry & Transformations
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Our Work Portfolio
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Real brides, event makeovers, and before-and-after transformations
            crafted with precision and passion.
          </p>
        </div>

        {/* Category Filters (Pills) */}
        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/gallery"
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                !categorySlug || categorySlug === "all"
                  ? "bg-foreground text-background"
                  : "bg-surface text-foreground border-border hover:bg-accent border"
              }`}
            >
              All Works
            </Link>

            {categories.map((cat) => {
              const isActive = categorySlug === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/gallery?category=${cat.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground border-border hover:bg-accent border"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Gallery Grid or Empty State */}
        {galleryResult.items.length === 0 ? (
          <EmptyState
            message={
              selectedCategoryName
                ? `No portfolio items found under "${selectedCategoryName}".`
                : "No portfolio items have been published yet."
            }
          />
        ) : (
          <div className="space-y-12">
            <GalleryGrid items={galleryResult.items} />

            <Pagination
              currentPage={galleryResult.currentPage}
              totalPages={galleryResult.totalPages}
              baseUrl="/gallery"
              searchParams={
                categorySlug ? { category: categorySlug } : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
