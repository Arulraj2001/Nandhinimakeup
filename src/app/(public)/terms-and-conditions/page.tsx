import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLegalPage } from "@/lib/data/legal-pages";
import { RichTextRenderer } from "@/components/public/rich-text-renderer";
import { extractPlainText } from "@/lib/utils/rich-text";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedLegalPage("terms-and-conditions");
  if (!page) {
    return buildMetadata({
      path: "/terms-and-conditions",
      forceNoIndex: true,
      generated: { title: "Terms & Conditions" },
    });
  }

  const excerpt = extractPlainText(page.content).slice(0, 160);
  return buildMetadata({
    path: "/terms-and-conditions",
    generated: {
      title: page.title,
      description:
        excerpt ||
        "Read our terms and conditions for bookings, orders, and services.",
    },
  });
}

export default async function TermsAndConditionsPage() {
  const page = await getPublishedLegalPage("terms-and-conditions");

  if (!page) {
    notFound();
  }

  const formattedDate = new Date(page.updated_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="border-border mb-8 border-b pb-6">
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        <p className="text-foreground/60 mt-2 text-xs sm:text-sm">
          Last updated: {formattedDate}
        </p>
      </header>

      <div className="mt-6">
        <RichTextRenderer content={page.content} />
      </div>
    </article>
  );
}
