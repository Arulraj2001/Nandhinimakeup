import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLegalPage } from "@/lib/data/legal-pages";
import { RichTextRenderer } from "@/components/public/rich-text-renderer";
import { extractPlainText } from "@/lib/utils/rich-text";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedLegalPage("shipping-and-returns");
  if (!page) {
    return { title: "Shipping & Returns | Nandhini Makeup & Jewellery" };
  }

  const excerpt = extractPlainText(page.content).slice(0, 160);
  return {
    title: `${page.title} | Nandhini Makeup & Jewellery`,
    description: excerpt || "Read our shipping timelines, domestic delivery rules, and return policy.",
  };
}

export default async function ShippingReturnsPage() {
  const page = await getPublishedLegalPage("shipping-and-returns");

  if (!page) {
    notFound();
  }

  const formattedDate = new Date(page.updated_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-foreground/60">
          Last updated: {formattedDate}
        </p>
      </header>

      <div className="mt-6">
        <RichTextRenderer content={page.content} />
      </div>
    </article>
  );
}
