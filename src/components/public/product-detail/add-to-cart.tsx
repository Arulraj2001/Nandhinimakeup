"use client";

import * as React from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/store";

interface AddToCartProps {
  productId: string;
  productName: string;
  stockStatus: "in_stock" | "out_of_stock" | "made_to_order";
  stockQuantity: number | null;
  acceptOrders: boolean;
}

export function AddToCart({
  productId,
  stockStatus,
  stockQuantity,
  acceptOrders,
}: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const isOutOfStock = stockStatus === "out_of_stock";
  const maxAvailable =
    stockQuantity !== null ? Math.min(10, Math.max(0, stockQuantity)) : 10;

  // Auto-hide inline confirmation after 5 seconds
  React.useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 5000);
    return () => clearTimeout(timer);
  }, [added]);

  if (!acceptOrders) {
    return (
      <div className="border-border/70 bg-surface/50 text-foreground/80 rounded-md border p-3.5 text-xs leading-relaxed">
        <p className="text-foreground font-medium">
          Online ordering is currently paused.
        </p>
        <p className="mt-1">
          Please contact us directly on WhatsApp below for availability and
          custom bookings.
        </p>
      </div>
    );
  }

  if (isOutOfStock) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="bg-muted text-muted-foreground w-full cursor-not-allowed rounded-md px-4 py-3 text-center text-sm font-semibold tracking-wider uppercase opacity-60"
        >
          Out of Stock
        </button>
        <p className="text-foreground/60 text-center text-xs">
          This piece is currently unavailable. Enquire below for restock
          updates.
        </p>
      </div>
    );
  }

  const handleAddToCart = () => {
    const success = addItem(productId, quantity);
    if (success) {
      setAdded(true);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Quantity Stepper */}
        <div className="border-border bg-surface flex h-11 items-center rounded-md border px-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="text-foreground hover:bg-page-background flex h-9 w-9 items-center justify-center rounded transition-colors disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-foreground w-8 text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= maxAvailable}
            className="text-foreground hover:bg-page-background flex h-9 w-9 items-center justify-center rounded transition-colors disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground h-11 flex-1 rounded-md text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
        >
          Add to Cart
        </button>
      </div>

      {stockQuantity !== null && stockQuantity > 0 && stockQuantity <= 3 && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Only {stockQuantity} left in stock!
        </p>
      )}

      {/* Inline confirmation */}
      {added && (
        <div className="flex items-center justify-between rounded-md border border-emerald-600/30 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
          <span className="flex items-center gap-1.5 font-medium">
            <svg
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Added to your cart!
          </span>
          <Link
            href="/cart"
            className="font-semibold underline underline-offset-2 hover:text-emerald-950 dark:hover:text-emerald-200"
          >
            View cart →
          </Link>
        </div>
      )}
    </div>
  );
}
