import type { Metadata } from "next";
import { getPublicFAQs } from "@/lib/data/faqs";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { EmptyState } from "@/components/public/empty-state";
import type { FAQ } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Frequently Asked Questions | ${settings.business.business_name}`;
  const description =
    "Find answers to common questions about bridal bookings, salon services, jewellery purchases, and shipping.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

const GROUP_LABELS: Record<string, string> = {
  general: "General Inquiries",
  services: "Makeup & Beauty Services",
  jewellery: "Jewellery & Accessories",
  orders_and_shipping: "Orders & Shipping",
  "orders and shipping": "Orders & Shipping",
};

export default async function FAQPage() {
  const faqs = await getPublicFAQs();

  // Group FAQs by group
  const groupedFaqs = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const grp = faq.group || "general";
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(faq);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedFaqs);

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "FAQ" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Questions & Answers
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            Everything you need to know about our bridal appointments, trial
            sessions, customised jewellery, and care tips.
          </p>
        </div>

        {/* FAQs or Empty State */}
        {faqs.length === 0 ? (
          <EmptyState message="No frequently asked questions available at this time." />
        ) : (
          <div className="space-y-12">
            {groupKeys.map((groupKey) => {
              const groupFaqs = groupedFaqs[groupKey];
              if (!groupFaqs || groupFaqs.length === 0) return null;

              const groupTitle = GROUP_LABELS[groupKey] || groupKey;

              return (
                <section key={groupKey} className="space-y-4">
                  <h2 className="font-heading text-foreground border-border border-b pb-2 text-xl font-semibold tracking-wide sm:text-2xl">
                    {groupTitle}
                  </h2>

                  <div className="space-y-3">
                    {groupFaqs.map((faq) => (
                      <details
                        key={faq.id}
                        className="group border-border bg-surface open:bg-surface/80 rounded-lg border p-4 transition-colors"
                      >
                        <summary className="font-heading text-foreground focus-visible:ring-foreground flex cursor-pointer list-none items-center justify-between rounded-sm text-base font-semibold focus-visible:ring-2 focus-visible:outline-none">
                          <span>{faq.question}</span>
                          <span
                            aria-hidden="true"
                            className="text-foreground/60 group-hover:text-foreground ml-4 flex-none transition-transform duration-200 group-open:rotate-180"
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </summary>

                        <div className="text-foreground/80 border-border mt-3 border-t pt-3 text-sm leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
