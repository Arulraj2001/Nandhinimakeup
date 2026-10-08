"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart/store";

export function HeaderCartIcon({ acceptOrders }: { acceptOrders?: boolean }) {
  const count = useCartCount();

  if (acceptOrders === false) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="text-foreground hover:text-foreground/75 relative inline-flex items-center justify-center p-2 transition-colors"
      aria-label={count > 0 ? `Shopping cart, ${count} items` : "Shopping cart"}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
        />
      </svg>
      {/* Reserved badge space with no layout shift */}
      <span
        className={`bg-foreground text-background absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold transition-opacity ${
          count > 0 ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      >
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
