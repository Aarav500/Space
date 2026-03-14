"use client";

interface DarkToggleProps {
  label?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  description?: string;
}

/**
 * DarkToggle — glass switch with smooth animation, indigo accent.
 */
export default function DarkToggle({ label, enabled, onChange, description }: DarkToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3 group text-left w-full"
    >
      {/* Track */}
      <div
        className={`
          relative h-6 w-11 rounded-full flex-shrink-0
          transition-all duration-300
          ${enabled
            ? "bg-indigo-500/30 border-indigo-500/40 shadow-[0_0_12px_-3px_rgba(99,102,241,0.3)]"
            : "bg-white/[0.04] border-white/[0.08]"
          }
          border
        `}
      >
        {/* Thumb */}
        <div
          className={`
            absolute top-0.5 h-5 w-5 rounded-full
            transition-all duration-300 ease-out
            ${enabled
              ? "left-[22px] bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              : "left-0.5 bg-gray-500"
            }
          `}
        />
      </div>

      {/* Label */}
      {(label || description) && (
        <div>
          {label && (
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              {label}
            </span>
          )}
          {description && (
            <p className="text-[10px] text-gray-700 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </button>
  );
}
