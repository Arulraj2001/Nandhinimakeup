import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/data/settings";
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
  const settings = await getPublicSiteSettings();

  return <CheckoutView settings={settings} />;
}
