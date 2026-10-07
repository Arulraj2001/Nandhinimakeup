"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/store";
import { lookupCartProducts } from "@/lib/actions/cart";
import type { CartProductLookup } from "@/lib/data/cart";
import type { SiteSettingsData } from "@/types/settings";
import { formatINR } from "@/lib/utils/currency";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

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

  // Construct WhatsApp Enquiry Link
  const whatsAppLines = lineItems
    .filter((l) => l.product)
    .map(
      (l) =>
        `- ${l.product?.name} x ${l.quantity}: ${formatINR(l.lineTotal)}`
    );
  whatsAppLines.push(`Subtotal: ${formatINR(subtotal)}`);
  whatsAppLines.push(
    `Delivery: ${isFreeDelivery ? "FREE" : formatINR(deliveryCharge)}`
  );
  whatsAppLines.push(`Estimated Total: ${formatINR(total)}`);

  const whatsAppLink = buildWhatsAppLink({
    phoneNumber: settings.business.whatsapp_number,
    greeting: `Hello ${settings.business.business_name}! I would like to enquire about my cart selection:`,
    extraLines: whatsAppLines,
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
          Explore our handcrafted bridal jewellery collection and add pieces to your cart.
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
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
          <p className="font-semibold">Online ordering is currently paused.</p>
          <p className="text-foreground/80 mt-1 text-xs sm:text-sm">
            Online checkout is temporarily disabled. You can review your items and tap &quot;Send cart on WhatsApp&quot; below to complete your order directly with us.
          </p>
        </div>
      )}

      {hasErrors && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
          One or more items in your cart are unavailable or out of stock. Please remove or adjust them before proceeding.
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Cart Item Lines */}
        <div className="lg:col-span-8">
          <div className="border-border divide-border divide-y rounded-lg border bg-surface">
            {lineItems.map((line) => {
              const product = line.product;
              const hasLineError = Boolean(line.errorReason);

              return (
                <div
                  key={line.productId}
                  className={`p-4 sm:p-6 transition-colors ${
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
                            className="text-foreground hover:underline text-sm font-semibold sm:text-base"
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
                              <span className="text-foreground/50 ml-2 line-through text-xs">
                                {formatINR(product.price)}
                              </span>
                            )}
                          </div>
                        )}

                        {hasLineError && (
                          <p className="text-destructive text-xs font-medium pt-1">
                            {line.errorReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stepper, Line Total, Remove */}
                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      {/* Quantity Stepper */}
                      <div className="flex h-9 items-center rounded-md border border-border bg-page-background px-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.productId, line.quantity - 1)
                          }
                          disabled={line.quantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-surface disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-foreground">
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
                          className="flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-surface disabled:opacity-30"
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
          <div className="border-border rounded-lg border bg-surface p-6 space-y-6">
            <h2 className="font-heading text-foreground text-lg font-semibold">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-foreground/80">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatINR(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-foreground/80">
                <span>Estimated Delivery</span>
                <span className="font-medium text-foreground">
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      FREE
                    </span>
                  ) : (
                    formatINR(deliveryCharge)
                  )}
                </span>
              </div>

              {freeThreshold !== null && freeThreshold > 0 && !isFreeDelivery && (
                <p className="text-xs text-foreground/60">
                  Add {formatINR(freeThreshold - subtotal)} more for free delivery!
                </p>
              )}

              <div className="border-border border-t pt-3 flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            {deliveryNote && (
              <p className="text-foreground/70 text-xs leading-relaxed border-border border-t pt-3">
                {deliveryNote}
              </p>
            )}

            <div className="space-y-3 pt-2">
              {acceptOrders && (
                <Link
                  href={hasErrors || items.length === 0 ? "#" : "/checkout"}
                  aria-disabled={hasErrors || items.length === 0}
                  className={`w-full inline-flex items-center justify-center rounded-md px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                    hasErrors || items.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  Proceed to Checkout
                </Link>
              )}

              {whatsAppLink && (
                <Link
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center rounded-md border border-border bg-page-background text-foreground hover:bg-surface px-6 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Send Cart on WhatsApp
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
