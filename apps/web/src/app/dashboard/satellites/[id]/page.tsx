"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RiskBadge from "@/components/RiskBadge";
import { satelliteApi, type Conjunction } from "@/lib/api";

interface RiskData {
  riskScore: number;
  riskLevel: string;
  forecast72h: { hour: number; predictedPc: number; riskLevel: string }[];
  conjunctions: Conjunction[];
}

export default function SatelliteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadRisk();
  }, [id]);

  async function loadRisk() {
    try {
      const data = await satelliteApi.getRisk(id);
      setRisk(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm transition-colors">
        ← Back to Fleet
      </button>

      {/* Risk Score Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collision Risk</h1>
            <p className="mt-1 text-gray-400">NORAD ID: {id}</p>
          </div>
          <RiskBadge level={risk?.riskLevel || "nominal"} size="lg" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            {risk?.riskScore ? parseFloat(String(risk.riskScore)).toExponential(3) : "—"}
          </p>
          <p className="mt-2 text-sm text-gray-400">Collision Probability (Pc)</p>
        </div>

        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* 72h Forecast */}
      {risk?.forecast72h && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">72-Hour Risk Forecast</h2>
          <div className="h-48 flex items-end gap-0.5">
            {risk.forecast72h.map((point, i) => {
              const height = Math.max(Math.min(Math.log10(point.predictedPc + 1e-10) + 10, 10) / 10 * 100, 2);
              const color = point.riskLevel === "critical" ? "bg-red-500" :
                           point.riskLevel === "warning" ? "bg-orange-500" :
                           point.riskLevel === "elevated" ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`+${point.hour}h: ${point.predictedPc.toExponential(2)}`}>
                  <div className={`w-full rounded-t ${color} opacity-70 transition-all hover:opacity-100`} style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Now</span>
            <span>+24h</span>
            <span>+48h</span>
            <span>+72h</span>
          </div>
        </div>
      )}

      {/* Conjunction Events */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold mb-4">Active Conjunction Events</h2>
        {risk?.conjunctions && risk.conjunctions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Secondary Object</th>
                  <th className="pb-3 font-medium">TCA</th>
                  <th className="pb-3 font-medium">Miss Distance</th>
                  <th className="pb-3 font-medium">Rel. Velocity</th>
                  <th className="pb-3 font-medium">Pc</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {risk && risk.conjunctions.map((conj) => (
                  <tr key={conj.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 font-mono text-xs">{conj.secondary_name || `NORAD ${conj.secondary_norad_id}`}</td>
                    <td className="py-3">{new Date(conj.tca).toLocaleString()}</td>
                    <td className="py-3">{parseFloat(conj.miss_distance_km).toFixed(3)} km</td>
                    <td className="py-3">{conj.relative_velocity_kms ? `${parseFloat(conj.relative_velocity_kms).toFixed(1)} km/s` : "—"}</td>
                    <td className="py-3 font-mono">{parseFloat(conj.collision_probability).toExponential(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No active conjunction events</p>
        )}
      </div>
    </div>
  );
}
