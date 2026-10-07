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
        "bg-foreground text-background font-medium tracking-wide uppercase text-[10px]";
      break;
    case "sale":
      label = label || "Sale";
      variantStyles =
        "bg-accent text-foreground font-semibold border border-foreground/20 text-[10px]";
      break;
    case "out_of_stock":
      label = label || "Out of Stock";
      variantStyles =
        "bg-surface text-foreground/70 border border-border text-[10px]";
      break;
    case "made_to_order":
      label = label || "Made to Order";
      variantStyles =
        "bg-surface text-foreground border border-border font-medium text-[10px]";
      break;
    case "featured":
      label = label || "Featured";
      variantStyles = "bg-accent text-foreground font-semibold text-[10px]";
      break;
    case "in_stock":
      label = label || "In Stock";
      variantStyles =
        "bg-surface text-foreground border border-foreground/30 font-medium text-[10px]";
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
