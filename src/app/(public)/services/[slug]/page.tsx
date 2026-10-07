import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getPublicServiceBySlug,
  getPublicRelatedServices,
} from "@/lib/data/services";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { PriceDisplay } from "@/components/public/price-display";
import { ServiceCard } from "@/components/public/service-card";
import { Breadcrumb } from "@/components/public/breadcrumb";

import { buildMetadata } from "@/lib/seo/metadata-builder";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);

  if (!service) {
    return buildMetadata({
      path: `/services/${slug}`,
      forceNoIndex: true,
      generated: {
        title: "Service Not Found",
      },
    });
  }

  const ogImageUrl = service.image
    ? getPublicMediaUrl(service.image.storage_path)
    : undefined;

  return buildMetadata({
    path: `/services/${slug}`,
    entity: {
      seo_title: service.seo_title,
      seo_description: service.seo_description,
      seo_social_image_id: service.seo_social_image_id,
      noindex: service.noindex,
    },
    generated: {
      title: service.name,
      description:
        service.short_description ||
        service.long_description?.slice(0, 160) ||
        `${service.name} bridal services.`,
      imageUrl: ogImageUrl,
      imageAlt: service.image?.alt_text || service.name,
    },
  });
}

async function ServiceDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([
    getPublicServiceBySlug(slug),
    getPublicSiteSettings(),
  ]);

  if (!service) {
    notFound();
  }

  const relatedServices = await getPublicRelatedServices(
    service.category_id,
    service.id,
    3
  );

  const imageUrl = service.image
    ? getPublicMediaUrl(service.image.storage_path)
    : null;

  const bookWhatsAppUrl = settings.business.whatsapp_number
    ? buildWhatsAppLink({
        phoneNumber: settings.business.whatsapp_number,
        greeting: `Hello ${settings.business.business_name}! I would like to book an appointment for:`,
        itemName: service.name,
        price:
          service.price_type === "on_request" ? "On Request" : service.price,
      })
    : "";

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Services", href: "/services" },
            { label: service.name },
          ]}
        />

        <article className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Service Image (Single LCP Image of page) */}
          <div className="bg-surface border-border relative aspect-4/3 w-full overflow-hidden rounded-xl border shadow-xs">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={service.image?.alt_text || service.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="text-foreground/40 flex h-full w-full items-center justify-center text-sm">
                No image available
              </div>
            )}
          </div>

          {/* Service Details & Booking */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {service.category && (
                <p className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
                  {service.category.name}
                </p>
              )}

              <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                {service.name}
              </h1>

              {/* Price and Duration */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <PriceDisplay
                  price={service.price}
                  priceType={service.price_type}
                  size="lg"
                />

                {service.duration_minutes && (
                  <span className="border-border bg-surface text-foreground/80 flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {service.duration_minutes} mins
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="text-foreground/85 border-border border-t pt-4 text-base leading-relaxed whitespace-pre-line">
                {service.long_description || service.short_description}
              </div>

              {/* Includes List */}
              {service.includes_list && service.includes_list.length > 0 && (
                <div className="border-border border-t pt-4">
                  <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
                    What&apos;s Included
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {service.includes_list.map((inc: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-foreground/80 flex items-start gap-2.5 text-sm"
                      >
                        <span className="text-foreground mt-0.5 font-bold">
                          ✓
                        </span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions: Book on WhatsApp */}
            {bookWhatsAppUrl && (
              <div className="border-border border-t pt-6">
                <Link
                  href={bookWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex w-full items-center justify-center rounded-md px-6 py-3.5 text-sm font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none sm:w-auto"
                >
                  Book on WhatsApp
                </Link>
                <p className="text-foreground/60 mt-2 text-xs">
                  Direct consultation and appointment confirmation with our
                  stylist.
                </p>
              </div>
            )}
          </div>
        </article>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <section className="border-border mt-20 border-t pt-12 sm:mt-24">
            <div className="mb-8">
              <h2 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
                Related Services in {service.category?.name || "This Category"}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((rel) => (
                <ServiceCard key={rel.id} service={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 flex min-h-[400px] items-center justify-center text-sm">
          Loading service details...
        </div>
      }
    >
      <ServiceDetailContent params={params} />
    </Suspense>
  );
}
