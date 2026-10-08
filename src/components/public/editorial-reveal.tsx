"use client";

import * as React from "react";
import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const emptySubscribe = () => () => {};

interface EditorialSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Editorial scroll-triggered section reveal:
 * Smooth fade + translateY(24px) over 650ms luxury ease-out.
 * Once: true (no exit animations). Collapses under prefers-reduced-motion.
 */
export function EditorialSection({
  children,
  className = "",
  delay = 0,
}: EditorialSectionProps) {
  const prefersReduced = useReducedMotion();
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isHydrated || prefersReduced) {
    return <section className={className}>{children}</section>;
  }

  return (
    <m.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className={className}
    >
      {children}
    </m.section>
  );
}

interface EditorialEyebrowProps {
  eyebrow: string;
  colorClass?: string;
  className?: string;
}

/**
 * Section eyebrow header with a 40px antique-gold rule that draws out from the left.
 */
export function EditorialEyebrow({
  eyebrow,
  colorClass = "text-[#8C2524]",
  className = "",
}: EditorialEyebrowProps) {
  const prefersReduced = useReducedMotion();
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div className={`mb-2 flex items-center gap-2.5 ${className}`}>
      {isHydrated && !prefersReduced ? (
        <m.span
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="inline-block h-[1px] w-[40px] origin-left bg-[#C5A059]"
        />
      ) : (
        <span aria-hidden="true" className="inline-block h-[1px] w-[40px] bg-[#C5A059]" />
      )}
      <p className={`text-xs font-semibold tracking-widest uppercase ${colorClass}`}>
        {eyebrow}
      </p>
    </div>
  );
}

interface EditorialStaggerGridProps {
  children: React.ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/**
 * Staggers children grid items by 90ms with a subtle upward drift.
 */
export function EditorialStaggerGrid({
  children,
  className = "",
}: EditorialStaggerGridProps) {
  const prefersReduced = useReducedMotion();
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isHydrated || prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return <m.div variants={itemVariants}>{child}</m.div>;
      })}
    </m.div>
  );
}
