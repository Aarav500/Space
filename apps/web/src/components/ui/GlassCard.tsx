"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

type GlowColor = "none" | "indigo" | "red" | "amber" | "emerald" | "cyan" | "violet";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: GlowColor;
  pulse?: boolean;
  critical?: boolean;
  as?: "div" | "button";
  delay?: number;
  hover?: boolean;
}

const glowStyles: Record<GlowColor, string> = {
  none: "",
  indigo: "shadow-indigo-500/8 hover:shadow-indigo-500/20",
  red: "shadow-red-500/8 hover:shadow-red-500/20",
  amber: "shadow-amber-500/8 hover:shadow-amber-500/15",
  emerald: "shadow-emerald-500/8 hover:shadow-emerald-500/15",
  cyan: "shadow-cyan-500/8 hover:shadow-cyan-500/15",
  violet: "shadow-violet-500/8 hover:shadow-violet-500/15",
};

/**
 * GlassCard — Framer Motion-enhanced frosted glass panel.
 *
 * Features:
 *  - Enter animation (fade + slide up)
 *  - Hover: scale + glow + border brighten
 *  - Gradient border overlay on hover
 *  - Shimmer sweep on hover
 *  - Optional pulse glow (critical state)
 *  - Animated conic-gradient border for critical
 */
export default function GlassCard({
  children,
  className = "",
  onClick,
  glow = "none",
  pulse = false,
  critical = false,
  as = "div",
  delay = 0,
  hover = true,
}: GlassCardProps) {
  const Component = motion[as];

  return (
    <Component
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={hover ? {
        scale: 1.015,
        transition: { duration: 0.3, ease: "easeOut" },
      } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      className={`
        glass-card group relative overflow-hidden rounded-2xl
        border border-white/[0.06]
        bg-white/[0.02] backdrop-blur-2xl
        shadow-xl ${glowStyles[glow]}
        transition-[border-color,background-color,box-shadow] duration-500 ease-out
        hover:border-white/[0.12] hover:bg-white/[0.04]
        hover:shadow-2xl
        ${pulse ? "glass-pulse" : ""}
        ${critical ? "glass-critical" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {/* Gradient border overlay (visible on hover) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), transparent 40%, transparent 60%, rgba(139,92,246,0.08))",
        }}
      />

      {/* Inner light edge — glass refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

      {/* Hover shimmer sweep */}
      <div className="glass-shimmer pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
