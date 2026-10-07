import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { CartView } from "@/components/public/cart/cart-view";

export const metadata: Metadata = {
  title: "Shopping Cart | Nandhini Makeup & Jewellery",
  description: "View and manage your selected jewellery items in your shopping cart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const settings = await getPublicSiteSettings();

  return <CartView settings={settings} />;
}
