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
      className="border-y border-[#E5DFD7] bg-[#F4ECE4]/50 py-10 sm:py-14 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-[#E5DFD7]/80 md:flex-row md:divide-y-0 md:divide-x md:divide-[#E5DFD7]/80">
          {counters.map((counter, idx) => (
            <div
              key={idx}
              className="flex flex-1 flex-col items-center justify-center py-6 px-4 text-center first:pt-0 last:pb-0 md:py-2 md:first:pt-2 md:last:pb-2"
            >
              <p className="font-heading text-4xl font-semibold tracking-tight text-[#1C1917] sm:text-5xl md:text-6xl">
                {displayValues[idx] ?? counter.number}
                <span className="text-[#C5A059] font-normal">+</span>
              </p>
              <p className="mt-2 text-xs font-semibold tracking-widest text-[#78716C] uppercase sm:text-sm">
                {counter.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
