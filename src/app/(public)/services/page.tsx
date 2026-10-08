import type { Metadata } from "next";
import { getPublicServices } from "@/lib/data/services";
import { getPublicServiceCategories } from "@/lib/data/service-categories";
import { ServiceCard } from "@/components/public/service-card";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumb } from "@/components/public/breadcrumb";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const services = await getPublicServices();
  return buildMetadata({
    path: "/services",
    hasItems: services.length > 0,
    generated: {
      title: "Bridal & Beauty Services",
      description:
        "Explore our professional bridal makeup services, reception transformations, and party look packages.",
    },
  });
}

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([
    getPublicServices(),
    getPublicServiceCategories(),
  ]);

  // Group services by category in category sort order
  const categoriesWithServices = categories
    .map((cat) => ({
      ...cat,
      services: services.filter((s) => s.category_id === cat.id),
    }))
    .filter((cat) => cat.services.length > 0);

  const hasAnyServices = categoriesWithServices.length > 0;

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Services" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Signature Transformations
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Services & Artistry
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Personalized bridal makeup packages, party glam, and traditional
            hair styling tailored for your most cherished moments.
          </p>
        </div>

        {/* Grouped Services or Empty State */}
        {!hasAnyServices ? (
          <EmptyState message="No services are currently listed. Please check back soon or enquire on WhatsApp." />
        ) : (
          <div className="space-y-16">
            {categoriesWithServices.map((cat) => (
              <section key={cat.id} className="space-y-6">
                <div className="border-border border-b pb-3">
                  <h2 className="font-heading text-foreground text-2xl font-semibold tracking-wide sm:text-3xl">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-foreground/70 mt-1 text-sm">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                  {cat.services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
