import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublishedLegalPages } from "@/lib/data/legal-pages";
import { CheckoutView } from "@/components/public/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout | Nandhini Makeup & Jewellery",
  description: "Complete your jewellery order delivery information.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const [settings, legalPages] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedLegalPages(),
  ]);

  return <CheckoutView settings={settings} legalPages={legalPages} />;
}
