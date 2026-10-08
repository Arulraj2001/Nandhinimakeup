import Link from "next/link";
import Image from "next/image";
import type { ServiceWithCategory } from "@/types/services";
import { PriceDisplay } from "@/components/public/price-display";
import { Badge } from "@/components/public/badges";
import { getPublicMediaUrl } from "@/lib/utils/media";

export function ServiceCard({ service }: { service: ServiceWithCategory }) {
  const imageUrl = service.image
    ? getPublicMediaUrl(service.image.storage_path)
    : null;

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#E5DFD7] bg-white transition-all duration-300 hover:border-[#C5A059] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C2524]"
    >
      {/* Aspect ratio container to prevent layout shift */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F4ECE4]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={service.image?.alt_text || service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-104"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#78716C]">
            No image available
          </div>
        )}
        {service.is_featured && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="rounded-md border border-[#C5A059]/40 bg-[#FAF8F5]/90 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#8C2524] uppercase shadow-xs backdrop-blur-md">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {service.category && (
          <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase">
            {service.category.name}
          </p>
        )}

        <h3 className="font-heading text-sm font-semibold tracking-wide text-[#1C1917] transition-colors group-hover:text-[#8C2524] sm:text-base line-clamp-1">
          {service.name}
        </h3>

        {service.short_description && (
          <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#57534E] line-clamp-2">
            {service.short_description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-[#E5DFD7] pt-2.5 text-xs">
          <PriceDisplay
            price={service.price}
            priceType={service.price_type}
            size="sm"
          />

          {service.duration_minutes ? (
            <span className="text-[11px] font-medium text-[#78716C]">
              ⏱ {service.duration_minutes}m
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#8C2524] transition-colors group-hover:translate-x-0.5">
              View Details →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
