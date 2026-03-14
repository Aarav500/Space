"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface DarkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

/**
 * DarkInput — glass-themed input with animated focus border,
 * optional label and icon. Replaces all native text inputs.
 */
const DarkInput = forwardRef<HTMLInputElement, DarkInputProps>(
  ({ label, icon, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
            {label}
          </label>
        )}
        <div
          className={`
            group flex items-center gap-2
            rounded-xl border px-4 py-2.5
            transition-all duration-300
            ${error
              ? "border-red-500/40 bg-red-500/[0.03]"
              : "border-white/[0.06] bg-white/[0.02] focus-within:border-indigo-500/40 focus-within:bg-white/[0.04] focus-within:shadow-[0_0_20px_-5px_rgba(99,102,241,0.12)]"
            }
            ${className}
          `}
        >
          {icon && <span className="text-gray-600 flex-shrink-0">{icon}</span>}
          <input
            ref={ref}
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-700 outline-none font-mono"
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);

DarkInput.displayName = "DarkInput";
export default DarkInput;
