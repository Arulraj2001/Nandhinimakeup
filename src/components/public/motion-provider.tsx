"use client";

import * as React from "react";
import { LazyMotion, domAnimation } from "motion/react";

/**
 * LazyMotion provider loaded only where motion is needed, with minimal DOM animation feature bundle.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
