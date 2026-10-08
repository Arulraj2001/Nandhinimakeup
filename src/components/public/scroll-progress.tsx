"use client";

import * as React from "react";
import { m, useScroll, useSpring } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ScrollProgressBarProps {
  className?: string;
}

export function ScrollProgressBar({ className = "" }: ScrollProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  if (reducedMotion) return null;

  return (
    <m.div
      aria-hidden="true"
      className={`pointer-events-none h-[2px] w-full origin-left bg-gradient-to-r from-[#C5A059] via-[#C5A059] to-[#8C2524] ${className}`}
      style={{ scaleX }}
    />
  );
}
