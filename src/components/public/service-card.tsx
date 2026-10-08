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
      className="border-border bg-page-background group flex h-full flex-col overflow-hidden rounded-lg border transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
    >
      {/* Aspect ratio container to prevent layout shift */}
      <div className="bg-surface relative aspect-4/3 w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={service.image?.alt_text || service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
            No image available
          </div>
        )}
        {service.is_featured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="featured">Featured</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {service.category && (
          <p className="text-foreground/60 mb-1 text-[11px] font-medium tracking-wider uppercase">
            {service.category.name}
          </p>
        )}

        <h3 className="font-heading text-foreground text-lg font-semibold tracking-wide group-hover:underline sm:text-xl">
          {service.name}
        </h3>

        {service.short_description && (
          <p className="text-foreground/80 mt-2 line-clamp-2 flex-1 text-sm leading-relaxed">
            {service.short_description}
          </p>
        )}

        <div className="border-border/60 mt-4 flex items-center justify-between border-t pt-3 text-sm">
          <PriceDisplay
            price={service.price}
            priceType={service.price_type}
            size="sm"
          />

          {service.duration_minutes ? (
            <span className="text-foreground/70 text-xs font-medium">
              ⏱ {service.duration_minutes} mins
            </span>
          ) : (
            <span className="text-foreground/60 group-hover:text-foreground text-xs transition-colors">
              View →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
