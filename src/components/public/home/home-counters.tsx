"use client";

import * as React from "react";
import type { HomeCounter } from "@/types/settings";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface HomeCountersProps {
  counters: HomeCounter[];
}

export function HomeCounters({ counters }: HomeCountersProps) {
  const reducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Maintain animated display values for each counter
  const [displayValues, setDisplayValues] = React.useState<number[]>(() =>
    counters.map((c) => c.number)
  );

  React.useEffect(() => {
    if (reducedMotion || hasAnimated) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Reset to 0 and animate count up to target
          const duration = 1200; // 1.2s
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            setDisplayValues(
              counters.map((c) => Math.round(c.number * easeProgress))
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValues(counters.map((c) => c.number));
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [counters, hasAnimated, reducedMotion]);

  if (!counters || counters.length === 0) return null;

  return (
    <section
      ref={containerRef}
      className="border-border bg-surface border-y py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {counters.map((counter, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-4 text-center"
            >
              <p className="font-heading text-foreground text-4xl font-bold sm:text-5xl md:text-6xl">
                {displayValues[idx] ?? counter.number}+
              </p>
              <p className="text-foreground/75 mt-2 text-xs font-semibold tracking-wider uppercase sm:text-sm">
                {counter.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
