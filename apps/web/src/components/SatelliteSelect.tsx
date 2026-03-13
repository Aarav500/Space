"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import RiskBadge from "./RiskBadge";

interface SatelliteOption {
  id: string;
  name: string;
  norad_id: number;
  risk_level: string;
}

interface SatelliteSelectProps {
  satellites: SatelliteOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

/**
 * SatelliteSelect — dark-themed custom dropdown for satellite selection.
 * Renders each option with name, NORAD ID, and risk badge.
 * Supports keyboard navigation (Tab, Arrow keys, Enter, Escape).
 */
export default function SatelliteSelect({
  satellites,
  value,
  onChange,
  placeholder = "Select satellite…",
}: SatelliteSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = satellites.find((s) => s.id === value);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (open && focusIdx >= 0 && listRef.current) {
      const el = listRef.current.children[focusIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIdx, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          setFocusIdx(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIdx((i) => Math.min(i + 1, satellites.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIdx((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusIdx >= 0 && focusIdx < satellites.length) {
            onChange(satellites[focusIdx].id);
            setOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, focusIdx, satellites, onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select satellite"
        onClick={() => { setOpen(!open); setFocusIdx(selected ? satellites.findIndex(s => s.id === value) : 0); }}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between gap-3
          rounded-xl border px-4 py-3 text-left text-sm
          transition-all duration-300 outline-none
          ${open
            ? "border-indigo-500/40 bg-white/[0.04] shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)]"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]"
          }
        `}
      >
        {selected ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-white truncate">{selected.name}</span>
            <span className="text-[10px] font-mono text-gray-600 tracking-wider flex-shrink-0">
              NORAD {selected.norad_id}
            </span>
            <div className="flex-shrink-0">
              <RiskBadge level={selected.risk_level} size="sm" />
            </div>
          </div>
        ) : (
          <span className="text-gray-600">{placeholder}</span>
        )}
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Satellites"
          className="
            absolute z-50 mt-2 w-full max-h-64 overflow-auto
            rounded-xl border border-white/[0.08]
            bg-[#0a0f1a]/95 backdrop-blur-2xl
            shadow-2xl shadow-black/40
            py-1
          "
        >
          {satellites.map((sat, i) => (
            <li
              key={sat.id}
              role="option"
              aria-selected={sat.id === value}
              onClick={() => { onChange(sat.id); setOpen(false); }}
              onMouseEnter={() => setFocusIdx(i)}
              className={`
                flex items-center justify-between gap-3 px-4 py-3 cursor-pointer
                transition-colors duration-150
                ${i === focusIdx ? "bg-indigo-500/10" : "hover:bg-white/[0.04]"}
                ${sat.id === value ? "text-indigo-300" : "text-gray-300"}
              `}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{sat.name}</span>
                <span className="text-[10px] font-mono text-gray-600 tracking-wider">
                  NORAD {sat.norad_id}
                </span>
              </div>
              <RiskBadge level={sat.risk_level} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
