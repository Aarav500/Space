"use client";

interface DarkSliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  displayValue?: string;
}

/**
 * DarkSlider — glass-themed range slider with gradient track,
 * value display badge, and optional label.
 */
export default function DarkSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  unit = "",
  displayValue,
}: DarkSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          {/* Track background */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
            <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
                }}
              />
            </div>
          </div>
          {/* Native input (styled) */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="relative w-full h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.5)]
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-400/50
              [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:scale-125
              [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-400/50
              [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.5)]
              [&::-moz-range-track]:bg-transparent
              [&::-webkit-slider-runnable-track]:bg-transparent
            "
          />
        </div>
        {/* Value display */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 min-w-[5rem] text-center">
          <span className="text-sm font-bold text-white tabular-nums">{displayValue ?? value}</span>
          {unit && <span className="text-[10px] text-gray-600 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
