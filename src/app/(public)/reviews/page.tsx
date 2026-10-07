import type { Metadata } from "next";
import { getPublicTestimonials } from "@/lib/data/testimonials";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { EmptyState } from "@/components/public/empty-state";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Client Reviews & Testimonials | ${settings.business.business_name}`;
  const description =
    "Read real words of love and testimonials from our lovely brides and makeover clients.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ReviewsPage() {
  const testimonials = await getPublicTestimonials();

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Reviews" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Client Words
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Kind Words & Reviews
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Real experiences, bridal joy, and feedback from the cherished
            clients we have had the honour of styling.
          </p>
        </div>

        {/* Testimonials Grid or Empty State */}
        {testimonials.length === 0 ? (
          <EmptyState message="No reviews have been published yet." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 transition-shadow hover:shadow-sm"
              >
                <div>
                  {/* Star Rating */}
                  <div
                    className="text-accent flex items-center gap-1"
                    aria-label={`Rated ${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "text-foreground fill-current"
                            : "text-foreground/20 fill-none stroke-current stroke-2"
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-foreground/90 mt-4 text-sm leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Author Info */}
                <div className="border-border mt-6 flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="font-heading text-foreground text-sm font-semibold">
                      {t.customer_name}
                    </p>
                    {t.occasion && (
                      <p className="text-foreground/60 mt-0.5 text-xs">
                        {t.occasion}
                      </p>
                    )}
                  </div>

                  {t.source && (
                    <span className="bg-page-background text-foreground/70 border-border rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                      {t.source}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
