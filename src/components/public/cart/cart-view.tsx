"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/store";
import { lookupCartProducts } from "@/lib/actions/cart";
import type { CartProductLookup } from "@/lib/data/cart";
import type { SiteSettingsData } from "@/types/settings";
import { formatINR } from "@/lib/utils/currency";
import { buildCartWhatsAppLink } from "@/lib/utils/whatsapp";

interface CartViewProps {
  settings: SiteSettingsData;
}

export function CartView({ settings }: CartViewProps) {
  const { items, updateQuantity, removeItem } = useCart();
  const [productsMap, setProductsMap] = React.useState<
    Record<string, CartProductLookup>
  >({});
  const [loading, setLoading] = React.useState(true);

  // Fetch updated product data for cart items from server
  React.useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      if (items.length === 0) {
        setProductsMap({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const productIds = items.map((i) => i.productId);
        const data = await lookupCartProducts(productIds);

        if (!isCancelled) {
          const map: Record<string, CartProductLookup> = {};
          for (const prod of data) {
            map[prod.id] = prod;
          }
          setProductsMap(map);
        }
      } catch (err) {
        console.error("Failed to lookup cart products", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [items]);

  const acceptOrders = settings.shipping.accept_orders;
  const flatDelivery = settings.shipping.flat_delivery_charge;
  const freeThreshold = settings.shipping.free_delivery_threshold;
  const deliveryNote = settings.shipping.delivery_note;

  // Validation checks for items
  const lineItems = items.map((item) => {
    const product = productsMap[item.productId];
    let isUnavailable = false;
    let isOutOfStock = false;
    let isQuantityExcess = false;
    let errorReason = "";

    if (!loading) {
      if (!product) {
        isUnavailable = true;
        errorReason = "This product is no longer available.";
      } else if (product.stockStatus === "out_of_stock") {
        isOutOfStock = true;
        errorReason = "This product is out of stock.";
      } else if (
        product.stockQuantity !== null &&
        item.quantity > product.stockQuantity
      ) {
        isQuantityExcess = true;
        errorReason = `Only ${product.stockQuantity} item(s) left in stock. Please adjust quantity.`;
      }
    }

    const price = product ? product.effectivePrice : 0;
    const lineTotal = price * item.quantity;

    return {
      ...item,
      product,
      isUnavailable,
      isOutOfStock,
      isQuantityExcess,
      errorReason,
      price,
      lineTotal,
    };
  });

  const hasErrors = lineItems.some((l) => Boolean(l.errorReason));
  const subtotal = lineItems.reduce((acc, l) => {
    if (l.product && !l.isUnavailable && !l.isOutOfStock) {
      return acc + l.lineTotal;
    }
    return acc;
  }, 0);

  const isFreeDelivery =
    freeThreshold !== null && freeThreshold > 0 && subtotal >= freeThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : flatDelivery;
  const total = subtotal + deliveryCharge;

  // Construct Beautiful Dynamic WhatsApp Cart Link
  const whatsAppCartItems = lineItems
    .filter((l) => l.product)
    .map((l) => ({
      name: l.product!.name,
      quantity: l.quantity,
      price: l.product!.effectivePrice,
      lineTotal: l.lineTotal,
    }));

  const whatsAppLink = buildCartWhatsAppLink({
    phoneNumber: settings.business.whatsapp_number,
    businessName: settings.business.business_name,
    items: whatsAppCartItems,
    subtotal,
    deliveryCharge,
    isFreeDelivery,
    total,
  });

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="border-border bg-surface mx-auto flex h-16 w-16 items-center justify-center rounded-full border">
          <svg
            className="text-foreground/50 h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-foreground mt-6 text-2xl font-semibold sm:text-3xl">
          Your Cart is Empty
        </h1>
        <p className="text-foreground/70 mx-auto mt-2 max-w-md text-sm">
          Explore our handcrafted bridal jewellery collection and add pieces to
          your cart.
        </p>
        <div className="mt-8">
          <Link
            href="/jewellery"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-md px-6 py-3 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Explore Jewellery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
          Shopping Cart
        </h1>
        <p className="text-foreground/70 mt-1 text-sm">
          Review your chosen jewellery pieces before continuing.
        </p>
      </div>

      {!acceptOrders && (
        <div className="text-foreground mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold">Online ordering is currently paused.</p>
          <p className="text-foreground/80 mt-1 text-xs sm:text-sm">
            Online checkout is temporarily disabled. You can review your items
            and tap &quot;Send cart on WhatsApp&quot; below to complete your
            order directly with us.
          </p>
        </div>
      )}

      {hasErrors && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-6 rounded-md border p-3.5 text-xs">
          One or more items in your cart are unavailable or out of stock. Please
          remove or adjust them before proceeding.
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Cart Item Lines */}
        <div className="lg:col-span-8">
          <div className="border-border divide-border bg-surface divide-y rounded-lg border">
            {lineItems.map((line) => {
              const product = line.product;
              const hasLineError = Boolean(line.errorReason);

              return (
                <div
                  key={line.productId}
                  className={`p-4 transition-colors sm:p-6 ${
                    hasLineError ? "bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Thumbnail & Product Info */}
                    <div className="flex items-start gap-4">
                      <div className="border-border bg-page-background relative h-20 w-20 flex-none overflow-hidden rounded-md border">
                        {product?.primaryImageUrl ? (
                          <Image
                            src={product.primaryImageUrl}
                            alt={product.primaryImageAlt || product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        {product ? (
                          <Link
                            href={
                              product.categorySlug
                                ? `/jewellery/${product.categorySlug}/${product.slug}`
                                : `/jewellery`
                            }
                            className="text-foreground text-sm font-semibold hover:underline sm:text-base"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="text-foreground/60 text-sm font-medium">
                            Unavailable Product
                          </span>
                        )}

                        {product && (
                          <div className="text-foreground/80 text-xs sm:text-sm">
                            {formatINR(product.effectivePrice)} each
                            {product.salePrice !== null && (
                              <span className="text-foreground/50 ml-2 text-xs line-through">
                                {formatINR(product.price)}
                              </span>
                            )}
                          </div>
                        )}

                        {hasLineError && (
                          <p className="text-destructive pt-1 text-xs font-medium">
                            {line.errorReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stepper, Line Total, Remove */}
                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      {/* Quantity Stepper */}
                      <div className="border-border bg-page-background flex h-9 items-center rounded-md border px-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.productId, line.quantity - 1)
                          }
                          disabled={line.quantity <= 1}
                          className="text-foreground hover:bg-surface flex h-7 w-7 items-center justify-center rounded disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-foreground w-8 text-center text-xs font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.productId, line.quantity + 1)
                          }
                          disabled={
                            line.quantity >= 10 ||
                            (product?.stockQuantity !== null &&
                              product?.stockQuantity !== undefined &&
                              line.quantity >= product.stockQuantity)
                          }
                          className="text-foreground hover:bg-surface flex h-7 w-7 items-center justify-center rounded disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-foreground w-20 text-right text-sm font-semibold">
                        {formatINR(line.lineTotal)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId)}
                        className="text-foreground/50 hover:text-destructive p-1.5 transition-colors"
                        aria-label={`Remove ${product?.name || "item"} from cart`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary & Actions */}
        <div className="lg:col-span-4">
          <div className="border-border bg-surface space-y-6 rounded-lg border p-6">
            <h2 className="font-heading text-foreground text-lg font-semibold">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="text-foreground/80 flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">
                  {formatINR(subtotal)}
                </span>
              </div>

              <div className="text-foreground/80 flex justify-between">
                <span>Estimated Delivery</span>
                <span className="text-foreground font-medium">
                  {isFreeDelivery ? (
                    <span className="font-bold text-emerald-800">
                      FREE
                    </span>
                  ) : (
                    formatINR(deliveryCharge)
                  )}
                </span>
              </div>

              {freeThreshold !== null &&
                freeThreshold > 0 &&
                !isFreeDelivery && (
                  <p className="text-foreground/60 text-xs">
                    Add {formatINR(freeThreshold - subtotal)} more for free
                    delivery!
                  </p>
                )}

              <div className="border-border text-foreground flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            {deliveryNote && (
              <p className="text-foreground/70 border-border border-t pt-3 text-xs leading-relaxed">
                {deliveryNote}
              </p>
            )}

            <div className="space-y-3 pt-2">
              {acceptOrders && (
                <Link
                  href={hasErrors || items.length === 0 ? "#" : "/checkout"}
                  aria-disabled={hasErrors || items.length === 0}
                  className={`inline-flex w-full items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                    hasErrors || items.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-[#8C2524] text-white hover:bg-[#731E1D] shadow-sm"
                  }`}
                >
                  Proceed to Checkout
                </Link>
              )}

              {whatsAppLink && (
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition-colors hover:bg-[#20BD5A]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Send Cart on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
