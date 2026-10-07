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
    <article className="border-border bg-page-background group flex flex-col overflow-hidden rounded-lg border transition-shadow duration-300 hover:shadow-md">
      {/* Product Image Container with aspect ratio and transform-only hover */}
      <div className="bg-surface relative aspect-square w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={primaryImage?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="text-foreground/60 text-[11px] font-medium tracking-wider uppercase">
            {product.category.name}
          </p>
        )}

        <h3 className="font-heading text-foreground mt-1 text-base font-semibold tracking-wide sm:text-lg">
          <Link
            href={`/jewellery/${categorySlug}/${product.slug}`}
            className="hover:underline focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex items-center justify-between pt-1">
          <PriceDisplay
            price={product.price}
            salePrice={product.sale_price}
            size="sm"
          />

          <span className="text-foreground/60 group-hover:text-foreground text-xs transition-colors">
            View →
          </span>
        </div>
      </div>
    </article>
  );
}
