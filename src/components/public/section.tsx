import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  align?: "left" | "center";
  containerClassName?: string;
}

export function Section({
  id,
  heading,
  subheading,
  description,
  align = "center",
  children,
  className,
  containerClassName,
  ...props
}: SectionProps) {
  const hasHeader = Boolean(heading || subheading || description);

  return (
    <section
      id={id}
      className={cn("py-12 sm:py-16 md:py-20", className)}
      {...props}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {hasHeader && (
          <div
            className={cn(
              "mb-10 sm:mb-12 md:mb-14",
              align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
            )}
          >
            {subheading && (
              <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
                {subheading}
              </p>
            )}
            {heading && (
              <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-foreground/80 mt-3 text-base sm:text-lg">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
