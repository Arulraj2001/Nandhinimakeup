import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublishedLegalPages } from "@/lib/data/legal-pages";
import { CheckoutView } from "@/components/public/checkout/checkout-view";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/checkout",
    forceNoIndex: true,
    generated: {
      title: "Checkout",
      description: "Complete your jewellery order delivery information.",
    },
  });
}

export default async function CheckoutPage() {
  const [settings, legalPages] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedLegalPages(),
  ]);

  return <CheckoutView settings={settings} legalPages={legalPages} />;
}
