"use client";

import RiskBadge from "./RiskBadge";

interface SatelliteRiskCardProps {
  satellite: {
    id: string;
    norad_id: number;
    name: string;
    orbit_type: string;
    current_risk_score: number;
    risk_level: string;
    last_updated: string;
  };
  onClick?: () => void;
}

export default function SatelliteRiskCard({ satellite, onClick }: SatelliteRiskCardProps) {
  const riskPercent = Math.min(satellite.current_risk_score * 1e6, 100);

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm transition-all hover:border-indigo-500/40 hover:bg-white/8 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      {/* Risk indicator bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-50" style={{ width: `${riskPercent}%` }} />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{satellite.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500 font-mono">NORAD {satellite.norad_id}</p>
        </div>
        <RiskBadge level={satellite.risk_level} size="sm" />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-400">{satellite.orbit_type}</span>
        <span className="text-gray-500 text-xs">
          Pc: {satellite.current_risk_score?.toExponential(2) || "—"}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Updated {new Date(satellite.last_updated).toLocaleTimeString()}
      </p>
    </button>
  );
}
