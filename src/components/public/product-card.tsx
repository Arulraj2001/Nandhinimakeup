import Link from "next/link";
import Image from "next/image";
import type { ProductWithDetails } from "@/types/products";
import { PriceDisplay } from "@/components/public/price-display";
import { Badge } from "@/components/public/badges";
import { getPublicMediaUrl } from "@/lib/utils/media";

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  const categorySlug = product.category?.slug || "all";
  const primaryImage = product.images?.[0]?.media;
  const imageUrl = primaryImage
    ? getPublicMediaUrl(primaryImage.storage_path)
    : null;

  const isOutOfStock = product.stock_status === "out_of_stock";
  const isMadeToOrder = product.stock_status === "made_to_order";
  const hasSale =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price < product.price;

  return (
    <Link
      href={`/jewellery/${categorySlug}/${product.slug}`}
      className="border-border bg-page-background group flex h-full flex-col overflow-hidden rounded-lg border transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
    >
      {/* Product Image Container with matching medium aspect ratio */}
      <div className="bg-surface relative aspect-4/3 w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={primaryImage?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-105"
          />
        ) : (
          <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
            No image available
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {isOutOfStock ? (
            <Badge variant="out_of_stock">Out of Stock</Badge>
          ) : isMadeToOrder ? (
            <Badge variant="made_to_order">Made to Order</Badge>
          ) : null}

          {hasSale && !isOutOfStock && <Badge variant="sale">Sale</Badge>}
          {product.is_new && !isOutOfStock && <Badge variant="new">New</Badge>}
        </div>
      </div>

      {/* Product Info with matching medium-mini padding */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="text-foreground/60 mb-1 text-[10px] font-semibold tracking-wider uppercase">
            {product.category.name}
          </p>
        )}

        <h3 className="font-heading text-foreground text-sm font-semibold tracking-wide group-hover:underline sm:text-base line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-foreground/75 mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
          <PriceDisplay
            price={product.price}
            salePrice={product.sale_price}
            size="sm"
          />

          <span className="text-foreground/60 group-hover:text-foreground text-[11px] transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
