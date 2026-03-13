"use client";

import { useState, useEffect } from "react";

/**
 * MissionClock — live UTC clock + system status LEDs (NASA command center style).
 */
export default function MissionClock() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toISOString().slice(11, 19));
      setDate(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          timeZone: "UTC",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-6">
      {/* UTC Clock */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold tracking-widest text-white tabular-nums">
          {time || "--:--:--"}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
          UTC
        </span>
      </div>

      {/* Date */}
      <span className="hidden text-xs font-medium uppercase tracking-wider text-gray-500 sm:inline">
        {date}
      </span>

      {/* Status LEDs */}
      <div className="flex items-center gap-3 border-l border-white/10 pl-6">
        <StatusLED label="API" status="online" />
        <StatusLED label="DATA" status="online" />
        <StatusLED label="ALERT" status="idle" />
      </div>
    </div>
  );
}

function StatusLED({ label, status }: { label: string; status: "online" | "warning" | "offline" | "idle" }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400 shadow-emerald-400/50",
    warning: "bg-amber-400 shadow-amber-400/50",
    offline: "bg-red-400 shadow-red-400/50",
    idle: "bg-gray-500 shadow-gray-500/30",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_6px] ${colors[status]} ${status === "online" ? "led-pulse" : ""}`} />
      <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-gray-500">
        {label}
      </span>
    </div>
  );
}
