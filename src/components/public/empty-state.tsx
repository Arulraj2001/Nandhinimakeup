import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message?: string;
  className?: string;
}

/**
 * Friendly short message shown on listing pages when no records exist.
 * Satisfies the Empty Data rule without broken links, empty cards or placeholders.
 */
export function EmptyState({
  message = "No items available at the moment. Please check back soon.",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-page-background mx-auto max-w-md rounded-lg border p-8 text-center",
        className
      )}
    >
      <p className="text-foreground/80 text-sm leading-relaxed">{message}</p>
    </div>
  );
}
