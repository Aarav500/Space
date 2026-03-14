"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface DarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<Variant, string> = {
  primary: `
    bg-gradient-to-r from-indigo-600/80 to-violet-600/80
    text-white font-semibold
    hover:from-indigo-500 hover:to-violet-500
    hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]
    hover:scale-[1.02]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
  `,
  secondary: `
    border border-white/[0.08] bg-white/[0.02]
    text-gray-300 font-medium
    hover:border-white/[0.15] hover:bg-white/[0.05]
    hover:text-white
  `,
  danger: `
    bg-gradient-to-r from-red-600/70 to-rose-600/70
    text-white font-semibold
    hover:from-red-500 hover:to-rose-500
    hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.25)]
  `,
  ghost: `
    text-gray-500
    hover:text-gray-300 hover:bg-white/[0.04]
  `,
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-8 py-3.5 text-base rounded-xl gap-2.5",
};

/**
 * DarkButton — 4 variants matching the OrbitShield glass design system.
 * primary (indigo gradient), secondary (glass border), danger (red), ghost.
 */
export default function DarkButton({
  variant = "primary",
  icon,
  loading = false,
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: DarkButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        backdrop-blur-sm transition-all duration-300
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
