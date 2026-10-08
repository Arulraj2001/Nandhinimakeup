import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublicFeaturedProducts } from "@/lib/data/products";
import { CartView } from "@/components/public/cart/cart-view";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/cart",
    forceNoIndex: true,
    generated: {
      title: "Shopping Cart",
      description:
        "View and manage your selected jewellery items in your shopping cart.",
    },
  });
}

export default async function CartPage() {
  const [settings, recommendedProducts] = await Promise.all([
    getPublicSiteSettings(),
    getPublicFeaturedProducts(4),
  ]);

  return (
    <CartView
      settings={settings}
      recommendedProducts={recommendedProducts}
    />
  );
}
