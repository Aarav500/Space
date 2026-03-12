"use client";

import { type Variants, useReducedMotion } from "framer-motion";

/**
 * Shared animation variants used across landing page components.
 * All variants support `custom` index for staggered delays.
 */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.12, duration: 0.4 },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

/**
 * Hook: returns reduced-motion-aware variants.
 * When user prefers reduced motion, returns fade-only (no y/scale movement).
 */
export function useMotionVariants() {
  const reduced = useReducedMotion();
  return {
    fadeUp: reduced ? fadeOnly : fadeUp,
    scaleIn: reduced ? fadeOnly : scaleIn,
    shouldAnimate: !reduced,
  };
}
