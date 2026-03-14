"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import RiskBadge from "@/components/RiskBadge";
import DarkButton from "@/components/ui/DarkButton";
import { satelliteApi, type Conjunction } from "@/lib/api";

interface RiskData {
  riskScore: number;
  riskLevel: string;
  forecast72h: { hour: number; predictedPc: number; riskLevel: string }[];
  conjunctions: Conjunction[];
}

const tabs = ["Risk Timeline", "Conjunctions", "Telemetry"] as const;
type Tab = (typeof tabs)[number];

export default function SatelliteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Risk Timeline");

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
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full" />
        <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading satellite data</span>
      </div>
    </div>
  );

  const riskLevel = risk?.riskLevel || "nominal";
  const riskColor =
    riskLevel === "critical" ? "#ef4444" :
    riskLevel === "warning" ? "#f97316" :
    riskLevel === "elevated" ? "#f59e0b" : "#10b981";

  return (
    <div className="space-y-8">
      {/* ═══ NAV ═══════════════════════════════════════════════════════ */}
      <DarkButton variant="ghost" size="sm" onClick={() => router.back()}>
        ← Back to Fleet
      </DarkButton>

      {/* ═══ HERO — Risk Score ═══════════════════════════════════════════ */}
      <GlassCard
        glow={riskLevel === "critical" ? "red" : riskLevel === "warning" ? "amber" : "indigo"}
        pulse={riskLevel === "critical"}
        critical={riskLevel === "critical"}
        className={`p-0 overflow-hidden ${riskLevel === "critical" ? "risk-scan" : ""}`}
      >
        <div className="p-8 md:p-10">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-[length:200%_100%] bg-clip-text text-transparent">
                  Collision Risk Analysis
                </span>
              </h1>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-600">
                Satellite ID · {id}
              </p>
            </div>
            <RiskBadge level={riskLevel} size="lg" />
          </div>

          {/* Big Pc number */}
          <div className="mt-10 text-center">
            <p
              className="text-7xl md:text-8xl font-black tracking-tighter tabular-nums"
              style={{ color: riskColor, textShadow: `0 0 60px ${riskColor}30` }}
            >
              {risk?.riskScore ? Number(risk.riskScore).toExponential(3) : "—"}
            </p>
            <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.3em] text-gray-600">
              Collision Probability (Pc)
            </p>
          </div>

          {/* Quick stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/[0.04] pt-6">
            <div className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">Risk Level</p>
              <p className="text-sm font-semibold text-white capitalize">{riskLevel}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">Conjunctions</p>
              <p className="text-sm font-semibold text-white">{risk?.conjunctions?.length || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">Forecast</p>
              <p className="text-sm font-semibold text-white">{risk?.forecast72h?.length || 0} data points</p>
            </div>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${riskColor}40, transparent)` }} />
      </GlassCard>

      {/* ═══ TABBED INTERFACE ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-1 border-b border-white/[0.04] pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-t-lg
              transition-all duration-200
              ${activeTab === tab
                ? "text-indigo-300 bg-white/[0.03] border border-white/[0.06] border-b-transparent -mb-px"
                : "text-gray-600 hover:text-gray-400"
              }
            `}
          >
            {tab}
          </button>
        ))}
        <div className="accent-line flex-1" />
      </div>

      {/* ─── Risk Timeline Tab ──────────────────────────────────────── */}
      {activeTab === "Risk Timeline" && risk?.forecast72h && (
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-gray-200 mb-6 flex items-center gap-2">
            <span className="text-indigo-400">◇</span>
            72-Hour Risk Forecast
          </h2>

          {/* Chart */}
          <div className="relative h-56 flex items-end gap-px">
            {/* Threshold line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-red-500/20"
              style={{ bottom: "70%" }}
            >
              <span className="absolute -top-3 right-0 text-[8px] font-mono text-red-500/50">Pc threshold</span>
            </div>

            {risk.forecast72h.map((point, i) => {
              const height = Math.max(Math.min(Math.log10(point.predictedPc + 1e-10) + 10, 10) / 10 * 100, 3);
              const barColor =
                point.riskLevel === "critical" ? "#ef4444" :
                point.riskLevel === "warning" ? "#f97316" :
                point.riskLevel === "elevated" ? "#f59e0b" : "#10b981";

              return (
                <div
                  key={i}
                  className="flex-1 group relative flex flex-col items-center justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 z-20 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-gray-200 bg-[#060912]/95 border border-white/[0.08] backdrop-blur-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    <span className="text-white">+{point.hour}h</span>
                    <span className="mx-1.5 text-gray-700">|</span>
                    <span style={{ color: barColor }}>{point.predictedPc.toExponential(2)}</span>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-200 group-hover:opacity-100 group-hover:shadow-lg"
                    style={{
                      height: `${height}%`,
                      backgroundColor: barColor,
                      opacity: 0.7,
                      boxShadow: `0 0 8px ${barColor}20`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis */}
          <div className="flex justify-between text-[10px] font-mono text-gray-700 mt-3 pt-2 border-t border-white/[0.03]">
            <span>Now</span>
            <span>+24h</span>
            <span>+48h</span>
            <span>+72h</span>
          </div>
        </GlassCard>
      )}

      {/* ─── Conjunctions Tab ───────────────────────────────────────── */}
      {activeTab === "Conjunctions" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-6 md:p-8 pb-0">
            <h2 className="text-lg font-semibold tracking-tight text-gray-200 mb-4 flex items-center gap-2">
              <span className="text-indigo-400">◇</span>
              Active Conjunction Events
            </h2>
          </div>

          {risk?.conjunctions && risk.conjunctions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/[0.06]">
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Secondary Object</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">TCA</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Miss Distance</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Rel. Velocity</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Pc</th>
                  </tr>
                </thead>
                <tbody>
                  {risk.conjunctions.map((conj) => {
                    const pc = parseFloat(conj.collision_probability);
                    const pcColor = pc > 1e-4 ? "text-red-400" : pc > 1e-6 ? "text-amber-400" : "text-gray-300";

                    return (
                      <tr key={conj.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{conj.secondary_name || "Unknown"}</span>
                          <span className="ml-2 text-[10px] font-mono text-gray-600">#{conj.secondary_norad_id}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono tabular-nums text-gray-400">
                          {new Date(conj.tca).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono tabular-nums text-gray-300">
                          {parseFloat(conj.miss_distance_km).toFixed(3)} km
                        </td>
                        <td className="px-6 py-4 font-mono tabular-nums text-gray-300">
                          {conj.relative_velocity_kms ? `${parseFloat(conj.relative_velocity_kms).toFixed(1)} km/s` : "—"}
                        </td>
                        <td className={`px-6 py-4 font-mono font-semibold tabular-nums ${pcColor}`}>
                          {pc.toExponential(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="text-4xl mb-4 opacity-30">🛡️</div>
              <p className="text-gray-400 font-medium">No active conjunction events</p>
              <p className="mt-1 text-sm text-gray-600">This satellite currently has no predicted close approaches</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* ─── Telemetry Tab ──────────────────────────────────────────── */}
      {activeTab === "Telemetry" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span className="text-indigo-400">◇</span>
              Orbital Parameters
            </h3>
            <div className="space-y-3">
              {[
                { label: "Satellite ID", value: id },
                { label: "Risk Level", value: riskLevel },
                { label: "Collision Probability", value: risk?.riskScore ? Number(risk.riskScore).toExponential(4) : "—" },
                { label: "Active Conjunctions", value: String(risk?.conjunctions?.length || 0) },
                { label: "Forecast Points", value: String(risk?.forecast72h?.length || 0) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">{row.label}</span>
                  <span className="text-sm font-mono text-gray-200 tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span className="text-indigo-400">◇</span>
              Status Summary
            </h3>
            <div className="flex flex-col items-center justify-center h-40">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: `radial-gradient(circle, ${riskColor}15 0%, transparent 70%)`,
                  boxShadow: `0 0 40px ${riskColor}15`,
                }}
              >
                <span className="text-2xl">
                  {riskLevel === "critical" ? "🔴" : riskLevel === "warning" ? "🟠" : riskLevel === "elevated" ? "🟡" : "🟢"}
                </span>
              </div>
              <p className="text-sm font-semibold text-white capitalize">{riskLevel}</p>
              <p className="text-[10px] text-gray-600 mt-1">
                {riskLevel === "critical" ? "Immediate action recommended" :
                 riskLevel === "warning" ? "Monitor closely" :
                 riskLevel === "elevated" ? "Elevated risk detected" :
                 "All systems nominal"}
              </p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
