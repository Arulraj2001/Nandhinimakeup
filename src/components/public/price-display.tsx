import { formatINR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price?: number | null;
  salePrice?: number | null;
  priceType?: "fixed" | "starting_from" | "on_request";
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function PriceDisplay({
  price,
  salePrice,
  priceType = "fixed",
  className,
  size = "default",
}: PriceDisplayProps) {
  if (priceType === "on_request") {
    return (
      <span
        className={cn(
          "text-foreground/80 font-medium italic",
          size === "sm" && "text-xs",
          size === "default" && "text-sm",
          size === "lg" && "text-base",
          className
        )}
      >
        Price on Request
      </span>
    );
  }

  const prefix = priceType === "starting_from" ? "From " : "";
  const hasSale =
    salePrice !== null &&
    salePrice !== undefined &&
    price !== null &&
    price !== undefined &&
    salePrice < price;

  return (
    <div className={cn("inline-flex items-baseline gap-2", className)}>
      {prefix && (
        <span className="text-foreground/70 text-xs font-normal">{prefix}</span>
      )}
      {hasSale ? (
        <>
          <span
            className={cn(
              "text-foreground font-semibold",
              size === "sm" && "text-sm",
              size === "default" && "text-base",
              size === "lg" && "text-xl font-bold"
            )}
          >
            {formatINR(salePrice)}
          </span>
          <span
            className={cn(
              "text-foreground/50 line-through",
              size === "sm" && "text-xs",
              size === "default" && "text-sm",
              size === "lg" && "text-base"
            )}
          >
            {formatINR(price!)}
          </span>
        </>
      ) : (
        <span
          className={cn(
            "text-foreground font-semibold",
            size === "sm" && "text-sm",
            size === "default" && "text-base",
            size === "lg" && "text-xl font-bold"
          )}
        >
          {price !== null && price !== undefined ? formatINR(price) : "—"}
        </span>
      )}
    </div>
  );
}
