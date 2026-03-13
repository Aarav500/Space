"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import GlassCard from "@/components/GlassCard";
import MissionClock from "@/components/MissionClock";
import RiskBadge from "@/components/RiskBadge";
import { satelliteApi, dashboardApi, type Satellite, type DashboardOverview } from "@/lib/api";

// Three.js globe — client-only (no SSR)
const OrbitalGlobe = dynamic(() => import("@/components/OrbitalGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full" />
        <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Initializing orbital view</span>
      </div>
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════════════════════
   RING GAUGE — animated SVG circular progress
   ═══════════════════════════════════════════════════════════════════════ */

function RingGauge({
  value,
  max,
  color,
  label,
  display,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  display: string | number;
}) {
  const [mounted, setMounted] = useState(false);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <GlassCard className="flex flex-col items-center p-5">
      <div className="relative">
        <svg width="92" height="92" className="ring-gauge" style={{ "--ring-color": color } as React.CSSProperties}>
          <circle className="ring-gauge-track" cx="46" cy="46" r={radius} />
          <circle
            className="ring-gauge-fill"
            cx="46" cy="46" r={radius}
            style={{
              "--circumference": circumference,
              "--offset": mounted ? offset : circumference,
              "--ring-color": color,
            } as React.CSSProperties}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "rotate(90deg)" }}>
          <span className="text-lg font-bold text-white counter-glow tabular-nums">{display}</span>
        </div>
      </div>
      <span className="mt-3 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNorad, setNewNorad] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [satsRes, overviewRes] = await Promise.all([
        satelliteApi.list(),
        dashboardApi.overview(),
      ]);
      setSatellites(satsRes.data);
      setOverview(overviewRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function addSatellite() {
    const noradId = parseInt(newNorad);
    if (isNaN(noradId)) return;
    try {
      await satelliteApi.add(noradId);
      setNewNorad("");
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  const mapPositions = satellites.map((sat, i) => ({
    id: sat.id,
    name: sat.name,
    norad_id: sat.norad_id,
    lat: Math.sin(i * 1.5) * 50,
    lng: ((i * 37 - 180) % 360),
    risk_level: sat.risk_level,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full" />
          <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading fleet data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ═══ MISSION HEADER ═══════════════════════════════════════════ */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-[length:200%_100%] bg-clip-text text-transparent">
              Fleet Command
            </span>
          </h1>
          <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.3em] text-gray-600">
            Collision Risk Monitoring · Real-Time Orbital Intelligence
          </p>
        </div>
        <MissionClock />
      </header>

      {/* Accent separator */}
      <div className="accent-line" />

      {/* ═══ COMMAND INPUT ════════════════════════════════════════════ */}
      <div className="flex items-center gap-4">
        <div
          className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl px-4 py-2.5 transition-all duration-300 focus-within:border-indigo-500/30 focus-within:bg-white/[0.03] focus-within:shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)]"
          onClick={() => inputRef.current?.focus()}
        >
          <span className="text-indigo-500 font-mono text-sm font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="number"
            placeholder="ENTER NORAD ID"
            value={newNorad}
            onChange={(e) => setNewNorad(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSatellite()}
            className="w-44 bg-transparent text-sm font-mono text-white placeholder-gray-700 outline-none"
          />
          <span className="animate-pulse text-indigo-500 font-mono">_</span>
        </div>
        <button
          onClick={addSatellite}
          className="rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:scale-[1.02]"
        >
          + Track Satellite
        </button>
      </div>

      {error && (
        <GlassCard glow="red" className="flex items-center gap-3 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-red-500 led-pulse" />
          <span className="text-sm text-red-300 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="rounded-lg p-1 text-red-400/60 hover:text-red-300 transition-colors">✕</button>
        </GlassCard>
      )}

      {/* ═══ RING GAUGE STATS ════════════════════════════════════════ */}
      {overview && (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <RingGauge value={overview.totalSats} max={20} color="#6366f1" label="Tracked Satellites" display={overview.totalSats} />
          <RingGauge value={65} max={100} color="#10b981" label="Avg Risk Score" display={overview.avgRisk?.toExponential(1) || "—"} />
          <RingGauge value={overview.criticalCount} max={5} color="#ef4444" label="Critical Alerts" display={overview.criticalCount} />
          <RingGauge value={overview.activePolicies} max={10} color="#8b5cf6" label="Active Policies" display={overview.activePolicies} />
        </div>
      )}

      {/* ═══ ORBITAL GLOBE ═══════════════════════════════════════════ */}
      {satellites.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-gray-300">Orbital View</h2>
            <div className="accent-line flex-1" />
          </div>
          <OrbitalGlobe
            satellites={mapPositions}
            onSatelliteClick={(id) => router.push(`/dashboard/satellites/${id}`)}
          />
        </section>
      )}

      {/* ═══ FLEET GRID ══════════════════════════════════════════════ */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-300">Your Fleet</h2>
          <div className="accent-line flex-1" />
          {satellites.length > 0 && (
            <span className="text-xs font-mono text-gray-600">{satellites.length} object{satellites.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {satellites.length === 0 ? (
          <GlassCard glow="indigo" className="py-16 text-center">
            <div className="text-5xl mb-5 opacity-40">🛰️</div>
            <p className="text-gray-400 text-lg font-medium">No satellites tracked</p>
            <p className="mt-2 text-sm text-gray-600">Enter a NORAD ID above to begin orbital monitoring</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {satellites.map((sat) => (
              <GlassCard
                key={sat.id}
                as="button"
                onClick={() => router.push(`/dashboard/satellites/${sat.id}`)}
                glow={sat.risk_level === "critical" ? "red" : sat.risk_level === "warning" ? "amber" : "indigo"}
                pulse={sat.risk_level === "critical"}
                critical={sat.risk_level === "critical"}
                className={`p-5 text-left ${sat.risk_level === "critical" ? "risk-scan" : ""}`}
              >
                {/* Risk progress bar */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] rounded-full opacity-50"
                  style={{
                    width: `${Math.min(Number(sat.current_risk_score || 0) * 1e6, 100)}%`,
                    background: "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)",
                  }}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{sat.name}</h3>
                    <p className="mt-0.5 text-[10px] text-gray-600 font-mono tracking-wider">NORAD {sat.norad_id}</p>
                  </div>
                  <RiskBadge level={sat.risk_level} size="sm" />
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{sat.orbit_type}</span>
                  <span className="text-gray-600 text-xs font-mono tabular-nums">
                    Pc {Number(sat.current_risk_score || 0).toExponential(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-gray-700" />
                  <p className="text-[10px] text-gray-700 font-mono">
                    {new Date(sat.last_updated).toLocaleTimeString()}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* ═══ RECENT ALERTS ═══════════════════════════════════════════ */}
      {overview && overview.recentAlerts.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-gray-300">Recent Alerts</h2>
            <div className="accent-line flex-1" />
          </div>
          <div className="space-y-3">
            {overview.recentAlerts.map((alert) => (
              <GlassCard
                key={alert.id}
                glow={alert.severity === "critical" ? "red" : "amber"}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${alert.severity === "critical" ? "bg-red-500 led-pulse" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{alert.message}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-gray-600 tracking-wider">
                    {alert.satellite_name} · {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
