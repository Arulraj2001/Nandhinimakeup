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
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-[#E5DFD7] bg-white transition-all duration-300 hover:border-[#C5A059] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C2524]"
    >
      {/* Product Image Container with matching medium aspect ratio */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F4ECE4]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={primaryImage?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#78716C]">
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
          {product.is_new && !isOutOfStock && (
            <span className="rounded-md border border-[#C5A059]/40 bg-[#FAF8F5]/90 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#8C2524] uppercase shadow-xs backdrop-blur-md">
              New Arrival
            </span>
          )}
        </div>
      </div>

      {/* Product Info with matching medium-mini padding */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase">
            {product.category.name}
          </p>
        )}

        <h3 className="font-heading text-sm font-semibold tracking-wide text-[#1C1917] transition-colors group-hover:text-[#8C2524] sm:text-base line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#57534E] line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-[#E5DFD7] pt-2.5 text-xs">
          <div className="transition-colors duration-200 group-hover:text-[#8C2524] [&_span]:transition-colors [&_span]:duration-200 group-hover:[&_span]:text-[#8C2524]">
            <PriceDisplay
              price={product.price}
              salePrice={product.sale_price}
              size="sm"
            />
          </div>

          <span className="text-[11px] font-medium text-[#8C2524] transition-colors group-hover:translate-x-0.5">
            Rent / Buy →
          </span>
        </div>
      </div>

      {/* Editorial Sweeping Gold Hairline on Card Bottom Edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-[#C5A059] transition-all duration-300 ease-out group-hover:w-full"
      />
    </Link>
  );
}
