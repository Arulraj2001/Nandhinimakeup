"use client";

import { useReducedMotion as useMotionReducedMotion } from "motion/react";

/**
 * Hook to detect whether the user has requested reduced motion in their OS / browser.
 */
export function useReducedMotion(): boolean {
  const prefersReduced = useMotionReducedMotion();
  return Boolean(prefersReduced);
}
