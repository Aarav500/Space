"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: "none" | "indigo" | "red" | "amber" | "emerald" | "cyan";
  pulse?: boolean;
  critical?: boolean;
  as?: "div" | "button";
}

/**
 * GlassCard — ultra-premium frosted glass panel.
 * Features: gradient border, hover shimmer sweep, inner light edge,
 * optional pulse glow and animated conic-gradient border for critical state.
 */
export default function GlassCard({
  children,
  className = "",
  onClick,
  glow = "none",
  pulse = false,
  critical = false,
  as = "div",
}: GlassCardProps) {
  const Tag = as;

  const glowShadow =
    glow === "indigo" ? "shadow-indigo-500/8 hover:shadow-indigo-500/20" :
    glow === "red" ? "shadow-red-500/8 hover:shadow-red-500/20" :
    glow === "amber" ? "shadow-amber-500/8 hover:shadow-amber-500/15" :
    glow === "emerald" ? "shadow-emerald-500/8 hover:shadow-emerald-500/15" :
    glow === "cyan" ? "shadow-cyan-500/8 hover:shadow-cyan-500/15" :
    "";

  return (
    <Tag
      onClick={onClick}
      className={`
        glass-card group relative overflow-hidden rounded-2xl
        border border-white/[0.06]
        bg-white/[0.02] backdrop-blur-2xl
        shadow-xl ${glowShadow}
        transition-all duration-500 ease-out
        hover:border-white/[0.12] hover:bg-white/[0.04]
        hover:shadow-2xl hover:scale-[1.01]
        ${pulse ? "glass-pulse" : ""}
        ${critical ? "glass-critical" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {/* Gradient border overlay (visible on hover) */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
    </Tag>
  );
}
