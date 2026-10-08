import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  "new" | "sale" | "out_of_stock" | "made_to_order" | "featured" | "in_stock";

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ variant, className, children }: BadgeProps) {
  let label = children;
  let variantStyles = "";

  switch (variant) {
    case "new":
      label = label || "New";
      variantStyles =
        "bg-[#1C1917] text-[#FAF8F5] border border-[#C5A059]/50 font-medium tracking-widest uppercase text-[10px]";
      break;
    case "sale":
      label = label || "Sale";
      variantStyles =
        "bg-[#8C2524] text-white font-semibold text-[10px]";
      break;
    case "out_of_stock":
      label = label || "Out of Stock";
      variantStyles =
        "bg-[#F4ECE4] text-[#78716C] border border-[#E5DFD7] text-[10px]";
      break;
    case "made_to_order":
      label = label || "Made to Order";
      variantStyles =
        "bg-white text-[#1C1917] border border-[#E5DFD7] font-medium text-[10px]";
      break;
    case "featured":
      label = label || "Featured";
      variantStyles =
        "bg-[#FAF8F5] text-[#8C2524] border border-[#C5A059] font-semibold text-[10px]";
      break;
    case "in_stock":
      label = label || "In Stock";
      variantStyles =
        "bg-white text-[#15803D] border border-emerald-200 font-medium text-[10px]";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 shadow-2xs select-none",
        variantStyles,
        className
      )}
    >
      {label}
    </span>
  );
}
