import Link from "next/link";
import type { ServiceCategory } from "@/types/services";

interface CategoryMarqueeProps {
  categories: ServiceCategory[];
}

export function CategoryMarquee({ categories }: CategoryMarqueeProps) {
  if (!categories || categories.length === 0) return null;

  // Duplicate items for continuous CSS ticker
  const duplicated = [
    ...categories,
    ...categories,
    ...categories,
    ...categories,
  ];

  return (
    <section className="border-border bg-page-background overflow-hidden border-b py-6">
      <div className="mx-auto mb-3 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-foreground/60 text-[11px] font-semibold tracking-widest uppercase">
          Specialised Service Offerings
        </p>
      </div>

      <div
        className="w-full overflow-hidden"
        role="region"
        aria-label="Service categories marquee"
      >
        <div className="animate-marquee flex items-center gap-4 py-2">
          {duplicated.map((cat, idx) => (
            <Link
              key={`${cat.id}-${idx}`}
              href={`/services`}
              className="group flex items-center gap-2 rounded-full border border-[#E5DFD7] bg-white px-5 py-2 whitespace-nowrap shadow-2xs transition-colors hover:border-[#C5A059] hover:bg-[#F4ECE4] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
            >
              <span className="text-xs font-semibold tracking-wider text-[#1C1917] uppercase">
                {cat.name}
              </span>
              <span className="text-xs text-[#C5A059] transition-transform duration-200 group-hover:scale-125">
                ✦
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
