"use client";

import * as React from "react";
import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

const emptySubscribe = () => () => {};

/**
 * Reveal-on-scroll animation component built with progressive enhancement.
 * In SSR and before client hydration, content is 100% visible and present in DOM.
 * Animations are transform and opacity only, and completely disabled if prefers-reduced-motion is active.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isHydrated || prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const offset = 18;
  const initial = {
    opacity: 0,
    x: direction === "left" ? offset : direction === "right" ? -offset : 0,
    y: direction === "up" ? offset : direction === "down" ? -offset : 0,
  };

  return (
    <m.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}
