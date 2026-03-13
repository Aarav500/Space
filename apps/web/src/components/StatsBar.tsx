"use client";

interface StatsBarProps {
  stats: {
    label: string;
    value: string | number;
    icon: string;
    trend?: "up" | "down" | "stable";
    color?: string;
  }[];
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/8"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">{stat.icon}</span>
            {stat.trend && (
              <span className={`text-xs font-medium ${stat.trend === "up" ? "text-red-400" : stat.trend === "down" ? "text-emerald-400" : "text-gray-400"}`}>
                {stat.trend === "up" ? "▲" : stat.trend === "down" ? "▼" : "—"}
              </span>
            )}
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{stat.value}</p>
          <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
          {/* Decorative gradient */}
          <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl ${stat.color || "bg-indigo-500"}`} />
        </div>
      ))}
    </div>
  );
}
