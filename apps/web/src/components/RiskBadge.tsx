"use client";

interface RiskBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
}

const colors: Record<string, { bg: string; text: string; glow: string }> = {
  nominal: { bg: "bg-emerald-500/15", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  elevated: { bg: "bg-amber-500/15", text: "text-amber-400", glow: "shadow-amber-500/20" },
  warning: { bg: "bg-orange-500/15", text: "text-orange-400", glow: "shadow-orange-500/20" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", glow: "shadow-red-500/30" },
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const c = colors[level] || colors.nominal;
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${c.bg} ${c.text} ${c.glow} shadow-sm ${sizes[size]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${level === "critical" ? "animate-pulse " : ""}${c.text.replace("text-", "bg-")}`} />
      {level}
    </span>
  );
}
