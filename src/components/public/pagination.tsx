import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | number | undefined>;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn("flex items-center justify-center gap-2 py-8", className)}
    >
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="border-border text-foreground hover:bg-surface focus-visible:ring-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Previous page"
        >
          Previous
        </Link>
      ) : (
        <span
          className="border-border text-foreground/40 inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border px-3 text-sm font-medium opacity-50"
          aria-disabled="true"
        >
          Previous
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return isCurrent ? (
            <span
              key={p}
              aria-current="page"
              className="bg-foreground text-background inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={createPageUrl(p)}
              className="border-border text-foreground hover:bg-surface inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium"
              aria-label={`Page ${p}`}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="border-border text-foreground hover:bg-surface focus-visible:ring-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Next page"
        >
          Next
        </Link>
      ) : (
        <span
          className="border-border text-foreground/40 inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border px-3 text-sm font-medium opacity-50"
          aria-disabled="true"
        >
          Next
        </span>
      )}
    </nav>
  );
}
