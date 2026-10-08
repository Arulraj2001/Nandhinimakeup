import { Suspense } from "react";
import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicProductBySlug,
  getPublicProductOnlyBySlug,
  getPublicRelatedProducts,
} from "@/lib/data/products";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { ProductGallery } from "@/components/public/product-gallery";
import { PriceDisplay } from "@/components/public/price-display";
import { ProductCard } from "@/components/public/product-card";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { Badge } from "@/components/public/badges";
import { AddToCart } from "@/components/public/product-detail/add-to-cart";
import { handleRedirectOrNotFound } from "@/lib/utils/redirects";

interface ProductDetailPageProps {
  params: Promise<{
    category: string;
    product: string;
  }>;
}

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { category: categorySlug, product: productSlug } = await params;
  const product = await getPublicProductBySlug(categorySlug, productSlug);

  if (!product) {
    return buildMetadata({
      path: `/jewellery/${categorySlug}/${productSlug}`,
      forceNoIndex: true,
      generated: {
        title: "Product Not Found",
      },
    });
  }

  const primaryImage = product.images?.[0]?.media;
  const ogImageUrl = primaryImage
    ? getPublicMediaUrl(primaryImage.storage_path)
    : undefined;

  return buildMetadata({
    path: `/jewellery/${categorySlug}/${productSlug}`,
    entity: {
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      seo_social_image_id: product.seo_social_image_id,
      noindex: product.noindex,
    },
    generated: {
      title: product.name,
      description:
        product.description?.slice(0, 160) ||
        `${product.name} handcrafted jewellery piece.`,
      imageUrl: ogImageUrl,
      imageAlt: primaryImage?.alt_text || product.name,
    },
  });
}

async function ProductDetailContent({
  params,
}: {
  params: Promise<{
    category: string;
    product: string;
  }>;
}) {
  const { category: categorySlug, product: productSlug } = await params;
  const settings = await getPublicSiteSettings();

  // 1. Fetch product by category and slug
  const product = await getPublicProductBySlug(categorySlug, productSlug);

  // 2. If not found, check if product exists under another category for permanent redirect
  if (!product) {
    const productUnderAnyCategory =
      await getPublicProductOnlyBySlug(productSlug);
    if (
      productUnderAnyCategory &&
      productUnderAnyCategory.category &&
      productUnderAnyCategory.category.slug !== categorySlug
    ) {
      permanentRedirect(
        `/jewellery/${productUnderAnyCategory.category.slug}/${productSlug}`
      );
    }

    await handleRedirectOrNotFound(`/jewellery/${categorySlug}/${productSlug}`);
    notFound();
  }

  const relatedProducts = await getPublicRelatedProducts(
    product.category_id,
    product.id,
    4
  );

  const isOutOfStock = product.stock_status === "out_of_stock";
  const isMadeToOrder = product.stock_status === "made_to_order";
  const whatsappButtonText = isOutOfStock
    ? "Ask About Availability"
    : "Enquire on WhatsApp";

  const effectivePrice =
    product.sale_price !== null && product.sale_price !== undefined
      ? product.sale_price
      : product.price;

  const enquireWhatsAppUrl = settings.business.whatsapp_number
    ? buildWhatsAppLink({
        phoneNumber: settings.business.whatsapp_number,
        greeting: isOutOfStock
          ? `Hello ${settings.business.business_name}! I would like to check availability for:`
          : `Hello ${settings.business.business_name}! I would like to enquire about purchasing:`,
        itemName: product.name,
        price: effectivePrice,
      })
    : "";

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Jewellery", href: "/jewellery" },
            {
              label: product.category?.name || "Category",
              href: `/jewellery/${product.category?.slug}`,
            },
            { label: product.name },
          ]}
        />

        <article className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery with swipe and thumbnails */}
          <div>
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Product Details & Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {product.category && (
                <p className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
                  {product.category.name}
                </p>
              )}

              <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              {/* Price and Stock Status */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <PriceDisplay
                  price={product.price}
                  salePrice={product.sale_price}
                  size="lg"
                />

                {isOutOfStock ? (
                  <Badge variant="out_of_stock">Out of Stock</Badge>
                ) : isMadeToOrder ? (
                  <Badge variant="made_to_order">Made to Order</Badge>
                ) : (
                  <Badge variant="in_stock">In Stock</Badge>
                )}
              </div>

              {product.sku && (
                <p className="text-foreground/60 text-xs">SKU: {product.sku}</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="border-border border-t pt-4">
                  <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
                    Product Description
                  </h2>
                  <div className="text-foreground/80 mt-2 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </div>
                </div>
              )}
            </div>

            {/* Ordering & Add to Cart */}
            <div className="border-border border-t pt-6 space-y-4">
              <AddToCart
                productId={product.id}
                productName={product.name}
                stockStatus={product.stock_status}
                stockQuantity={product.stock_quantity}
                acceptOrders={settings.shipping.accept_orders}
              />
            </div>

            {/* Actions: Enquire on WhatsApp */}
            {enquireWhatsAppUrl && (
              <div className="border-border border-t pt-6">
                <Link
                  href={enquireWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex w-full items-center justify-center rounded-md px-6 py-3.5 text-sm font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none sm:w-auto"
                >
                  {whatsappButtonText}
                </Link>
                <p className="text-foreground/60 mt-2 text-xs">
                  {isOutOfStock
                    ? "Currently out of stock. Contact us to inquire about re-stocking or custom ordering."
                    : "Connect with us on WhatsApp for orders, custom sizing, and shipping inquiries."}
                </p>
              </div>
            )}
          </div>
        </article>

        {/* Related Products in Same Category */}
        {relatedProducts.length > 0 && (
          <section className="border-border mt-20 border-t pt-12 sm:mt-24">
            <div className="mb-8">
              <h2 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
                More in {product.category?.name || "This Category"}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="text-foreground/40 flex min-h-[400px] items-center justify-center text-sm">
          Loading product details...
        </div>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
