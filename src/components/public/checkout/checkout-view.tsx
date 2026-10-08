"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCart } from "@/lib/cart/store";
import { lookupCartProducts } from "@/lib/actions/cart";
import { submitCheckout } from "@/lib/actions/checkout";
import {
  checkoutFormSchema,
  type CheckoutFormData,
} from "@/lib/validation/checkout";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants/indian-states";
import type { CartProductLookup } from "@/lib/data/cart";
import type { SiteSettingsData } from "@/types/settings";
import { formatINR } from "@/lib/utils/currency";

interface CheckoutViewProps {
  settings: SiteSettingsData;
  legalPages?: Array<{ slug: string; title: string }>;
}

export function CheckoutView({ settings, legalPages = [] }: CheckoutViewProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [productsMap, setProductsMap] = React.useState<
    Record<string, CartProductLookup>
  >({});
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "Tamil Nadu",
      pin_code: "",
      customer_note: "",
      honeypot: "",
    },
  });

  // Redirect to /cart if cart is empty after hydration
  React.useEffect(() => {
    if (!loadingProducts && items.length === 0) {
      router.replace("/cart");
    }
  }, [items, loadingProducts, router]);

  // Load latest product pricing and stock
  React.useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      if (items.length === 0) {
        setLoadingProducts(false);
        return;
      }

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
        console.error("Failed to fetch product details for checkout", err);
      } finally {
        if (!isCancelled) {
          setLoadingProducts(false);
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

  // Calculate subtotal from server products
  const lineItems = items.map((item) => {
    const product = productsMap[item.productId];
    const price = product ? product.effectivePrice : 0;
    return {
      ...item,
      product,
      lineTotal: price * item.quantity,
    };
  });

  const subtotal = lineItems.reduce((acc, l) => acc + l.lineTotal, 0);
  const isFreeDelivery =
    freeThreshold !== null && freeThreshold > 0 && subtotal >= freeThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : flatDelivery;
  const total = subtotal + deliveryCharge;

  const onSubmit = async (data: CheckoutFormData) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const result = await submitCheckout(payload);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, errors] of Object.entries(result.fieldErrors)) {
            if (errors && errors.length > 0) {
              form.setError(field as keyof CheckoutFormData, {
                message: errors[0],
              });
            }
          }
        }
        setServerError(
          result.error ||
            "Unable to place your order. Please check the details and try again."
        );
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart and redirect to order status page
      clearCart();
      router.replace(
        `/order/${result.data.orderNumber}?token=${result.data.accessToken}`
      );
    } catch (err) {
      console.error("Checkout submission failed", err);
      setServerError(
        "A network error occurred. Please check your connection and try again."
      );
      setIsSubmitting(false);
    }
  };

  if (!acceptOrders) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-sm">
          <h1 className="font-heading text-foreground text-xl font-semibold">
            Online Orders Temporarily Paused
          </h1>
          <p className="text-foreground/80 mt-2">
            We are not accepting direct online orders at the moment. You can
            still review your selected items in the cart and connect with us on
            WhatsApp for assistance.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/cart"
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !loadingProducts) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-foreground/70 text-sm">Your cart is empty.</p>
        <Link
          href="/jewellery"
          className="text-foreground mt-4 inline-block text-sm font-semibold underline"
        >
          Explore Jewellery →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
          Checkout
        </h1>
        <p className="text-foreground/70 mt-1 text-sm">
          Please enter your delivery details. Payment will be completed via UPI
          on the next screen.
        </p>
      </div>

      {serverError && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive mb-6 rounded-md border p-4 text-xs">
          <p className="font-semibold">Notice:</p>
          <p className="mt-1">{serverError}</p>
          {serverError.includes("stock") ||
          serverError.includes("available") ? (
            <div className="mt-2">
              <Link
                href="/cart"
                className="font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Return to cart to update items →
              </Link>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="border-border bg-surface space-y-6 rounded-lg border p-6 sm:p-8"
            noValidate
          >
            {/* Honeypot field (hidden from real users) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...form.register("honeypot")}
              />
            </div>

            <div>
              <h2 className="font-heading text-foreground border-border border-b pb-3 text-lg font-semibold">
                Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="customer_name"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="customer_name"
                  type="text"
                  autoComplete="name"
                  {...form.register("customer_name")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="e.g. Priya Sundaram"
                />
                {form.formState.errors.customer_name && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.customer_name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label
                  htmlFor="phone"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  {...form.register("phone")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="e.g. 9876543210"
                />
                <p className="text-foreground/50 text-[11px]">
                  10-digit Indian mobile number
                </p>
                {form.formState.errors.phone && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Email Address{" "}
                  <span className="text-foreground/50">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="e.g. priya@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <h2 className="font-heading text-foreground border-border border-b pb-3 text-lg font-semibold">
                Shipping Address
              </h2>
            </div>

            <div className="space-y-4">
              {/* Address Line 1 */}
              <div className="space-y-1">
                <label
                  htmlFor="address_line_1"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Address Line 1 <span className="text-destructive">*</span>
                </label>
                <input
                  id="address_line_1"
                  type="text"
                  autoComplete="address-line1"
                  {...form.register("address_line_1")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="House/Flat number, Building, Street"
                />
                {form.formState.errors.address_line_1 && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.address_line_1.message}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1">
                <label
                  htmlFor="address_line_2"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Address Line 2{" "}
                  <span className="text-foreground/50">(Optional)</span>
                </label>
                <input
                  id="address_line_2"
                  type="text"
                  autoComplete="address-line2"
                  {...form.register("address_line_2")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="Landmark, Area, Apartment Name"
                />
                {form.formState.errors.address_line_2 && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.address_line_2.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* City */}
                <div className="space-y-1">
                  <label
                    htmlFor="city"
                    className="text-foreground text-xs font-semibold tracking-wider uppercase"
                  >
                    City <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    {...form.register("city")}
                    className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                    placeholder="e.g. Chennai"
                  />
                  {form.formState.errors.city && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label
                    htmlFor="state"
                    className="text-foreground text-xs font-semibold tracking-wider uppercase"
                  >
                    State <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="state"
                    autoComplete="address-level1"
                    {...form.register("state")}
                    className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.state && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.state.message}
                    </p>
                  )}
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label
                    htmlFor="pin_code"
                    className="text-foreground text-xs font-semibold tracking-wider uppercase"
                  >
                    PIN Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="pin_code"
                    type="text"
                    maxLength={6}
                    autoComplete="postal-code"
                    {...form.register("pin_code")}
                    className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                    placeholder="e.g. 600001"
                  />
                  {form.formState.errors.pin_code && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.pin_code.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Note */}
              <div className="space-y-1 pt-2">
                <label
                  htmlFor="customer_note"
                  className="text-foreground text-xs font-semibold tracking-wider uppercase"
                >
                  Order Notes{" "}
                  <span className="text-foreground/50">(Optional)</span>
                </label>
                <textarea
                  id="customer_note"
                  rows={2}
                  {...form.register("customer_note")}
                  className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="Any special instructions or delivery preferences"
                />
              </div>
            </div>

            <div className="pt-4">
              {(() => {
                const terms = legalPages.find(
                  (p) => p.slug === "terms-and-conditions"
                );
                const shipping = legalPages.find(
                  (p) => p.slug === "shipping-and-returns"
                );

                if (terms && shipping) {
                  return (
                    <p className="text-foreground/70 mb-3 text-center text-xs sm:text-left">
                      By placing this order you agree to our{" "}
                      <Link
                        href="/terms-and-conditions"
                        className="hover:text-foreground underline underline-offset-2"
                        target="_blank"
                      >
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/shipping-returns"
                        className="hover:text-foreground underline underline-offset-2"
                        target="_blank"
                      >
                        Shipping &amp; Returns
                      </Link>
                      .
                    </p>
                  );
                }

                if (terms) {
                  return (
                    <p className="text-foreground/70 mb-3 text-center text-xs sm:text-left">
                      By placing this order you agree to our{" "}
                      <Link
                        href="/terms-and-conditions"
                        className="hover:text-foreground underline underline-offset-2"
                        target="_blank"
                      >
                        Terms &amp; Conditions
                      </Link>
                      .
                    </p>
                  );
                }

                if (shipping) {
                  return (
                    <p className="text-foreground/70 mb-3 text-center text-xs sm:text-left">
                      By placing this order you agree to our{" "}
                      <Link
                        href="/shipping-returns"
                        className="hover:text-foreground underline underline-offset-2"
                        target="_blank"
                      >
                        Shipping &amp; Returns
                      </Link>
                      .
                    </p>
                  );
                }

                return null;
              })()}

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="bg-foreground text-background hover:bg-foreground/90 flex h-12 w-full items-center justify-center rounded-md text-xs font-semibold tracking-wider uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Placing Order..."
                  : "Place Order & Pay via UPI →"}
              </button>
              <p className="text-foreground/60 mt-2 text-center text-xs">
                Manual UPI payment: You will be shown a UPI QR and link to pay
                on the next screen.
              </p>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="border-border bg-surface sticky top-20 space-y-6 rounded-lg border p-6">
            <h2 className="font-heading text-foreground text-lg font-semibold">
              Order Summary ({items.reduce((acc, i) => acc + i.quantity, 0)}{" "}
              items)
            </h2>

            <div className="divide-border max-h-80 divide-y overflow-y-auto pr-1">
              {lineItems.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="border-border bg-page-background relative h-14 w-14 flex-none overflow-hidden rounded-md border">
                    {line.product?.primaryImageUrl ? (
                      <Image
                        src={line.product.primaryImageUrl}
                        alt={line.product.primaryImageAlt || line.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-foreground/30 flex h-full w-full items-center justify-center text-[10px]">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-xs font-medium">
                      {line.product?.name || "Loading..."}
                    </p>
                    <p className="text-foreground/60 text-xs">
                      Qty: {line.quantity}
                    </p>
                  </div>
                  <div className="text-foreground text-right text-xs font-semibold">
                    {formatINR(line.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-border space-y-2.5 border-t pt-4 text-sm">
              <div className="text-foreground/80 flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">
                  {formatINR(subtotal)}
                </span>
              </div>

              <div className="text-foreground/80 flex justify-between">
                <span>Delivery</span>
                <span className="text-foreground font-medium">
                  {isFreeDelivery ? (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      FREE
                    </span>
                  ) : (
                    formatINR(deliveryCharge)
                  )}
                </span>
              </div>

              <div className="border-border text-foreground flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            {deliveryNote && (
              <p className="border-border text-foreground/70 border-t pt-3 text-xs leading-relaxed">
                {deliveryNote}
              </p>
            )}

            <div className="pt-2">
              <Link
                href="/cart"
                className="text-foreground/70 hover:text-foreground text-xs font-medium underline underline-offset-2"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
