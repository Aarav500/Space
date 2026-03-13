/* Coverage Marketplace — collision risk micro-insurance */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import SatelliteSelect from "@/components/SatelliteSelect";
import { satelliteApi, coverageApi, type Satellite, type CoveragePolicy } from "@/lib/api";

interface Quote {
  hourlyCents: number;
  totalCents: number;
  maxPayoutCents: number;
  currency: string;
}

export default function CoveragePage() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [policies, setPolicies] = useState<CoveragePolicy[]>([]);
  const [selectedSat, setSelectedSat] = useState("");
  const [hours, setHours] = useState(24);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [sats, pols] = await Promise.all([
        satelliteApi.list(),
        coverageApi.policies(),
      ]);
      setSatellites(sats.data);
      setPolicies(pols.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function getQuote() {
    if (!selectedSat) return;
    setError(null);
    try {
      const q = await coverageApi.quote(selectedSat, hours);
      setQuote(q);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      // Friendlier error messages
      if (msg.includes("noradId") && msg.includes("between")) {
        setError("Enter a valid NORAD ID between 1 and 999,999.");
      } else {
        setError(msg);
      }
    }
  }

  async function checkout() {
    if (!selectedSat) return;
    setError(null);
    try {
      const session = await coverageApi.checkout(selectedSat, hours);
      if (session.url) window.location.href = session.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  const selected = satellites.find((s) => s.id === selectedSat);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full" />
        <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading coverage data</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* ═══ HEADER ═══════════════════════════════════════════════ */}
      <header>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-[length:200%_100%] bg-clip-text text-transparent">
            Coverage Marketplace
          </span>
        </h1>
        <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.3em] text-gray-600">
          Parametric Collision Micro-Coverage · Powered by Stripe
        </p>
      </header>

      <div className="accent-line" />

      {/* ═══ EMPTY STATE — no satellites ══════════════════════════ */}
      {satellites.length === 0 ? (
        <GlassCard glow="indigo" className="py-16 text-center">
          <div className="text-5xl mb-5 opacity-40">🛡️</div>
          <p className="text-gray-300 text-lg font-semibold">No satellites eligible for coverage</p>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Track a satellite from Fleet Command to generate a coverage quote.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]"
          >
            Go to Fleet Command
          </Link>
        </GlassCard>
      ) : (
        <>
          {/* ═══ QUOTE BUILDER — Two Column ════════════════════════ */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Left column — Controls */}
              <div className="lg:col-span-3 p-8 space-y-6">
                <h2 className="text-lg font-semibold tracking-tight text-gray-200 flex items-center gap-2">
                  <span className="text-indigo-400">◇</span>
                  Get a Coverage Quote
                </h2>

                {/* Satellite selector */}
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
                    Select Satellite
                  </label>
                  <SatelliteSelect
                    satellites={satellites}
                    value={selectedSat}
                    onChange={(id) => { setSelectedSat(id); setQuote(null); setError(null); }}
                    placeholder="Choose a satellite…"
                  />
                </div>

                {/* Duration slider */}
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
                    Coverage Duration
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="720"
                      value={hours}
                      onChange={(e) => { setHours(parseInt(e.target.value)); setQuote(null); }}
                      className="flex-1 accent-indigo-500 h-2"
                    />
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 min-w-[6rem] text-center">
                      <span className="text-lg font-bold text-white tabular-nums">{hours}</span>
                      <span className="text-xs text-gray-500 ml-1">hrs</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] font-mono text-gray-700 tracking-wider">
                    {(hours / 24).toFixed(1)} days coverage window
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <GlassCard glow="red" className="flex items-center gap-3 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 led-pulse flex-shrink-0" />
                    <span className="text-sm text-red-300 flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="rounded-lg p-1 text-red-400/60 hover:text-red-300 transition-colors">✕</button>
                  </GlassCard>
                )}

                {/* Get Quote button */}
                <button
                  onClick={getQuote}
                  disabled={!selectedSat}
                  className="rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate Quote
                </button>
              </div>

              {/* Right column — Coverage Summary */}
              <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-white/[0.04] bg-white/[0.01] p-8 flex flex-col justify-center">
                {selected ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-2">Selected Asset</p>
                      <p className="text-xl font-bold text-white">{selected.name}</p>
                      <p className="text-[10px] font-mono text-gray-600 tracking-wider mt-0.5">NORAD {selected.norad_id} · {selected.orbit_type}</p>
                    </div>
                    <div className="accent-line" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">Coverage Window</p>
                        <p className="text-sm text-gray-300 tabular-nums">{hours} hours</p>
                        <p className="text-[10px] text-gray-600">{(hours / 24).toFixed(1)} days</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">Risk Score</p>
                        <p className="text-sm text-gray-300 tabular-nums">
                          Pc {Number(selected.current_risk_score || 0).toExponential(2)}
                        </p>
                        <p className="text-[10px] text-gray-600">{selected.risk_level}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-3xl opacity-30 mb-3">🛰️</div>
                    <p className="text-sm text-gray-600">Select a satellite to see coverage details</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* ═══ QUOTE RESULT ══════════════════════════════════════ */}
          {quote && (
            <GlassCard glow="indigo" className="p-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-6 flex items-center gap-2">
                <span className="text-indigo-400">◇</span>
                Coverage Quote
              </h3>

              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-2">Hourly Rate</p>
                  <p className="text-2xl font-bold text-white tabular-nums">${(quote.hourlyCents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-600">per hour</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-2">Total Cost</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent tabular-nums">
                    ${(quote.totalCents / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-600">{hours} hours</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-2">Max Payout</p>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">${(quote.maxPayoutCents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-600">if triggered</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-2">Coverage Ratio</p>
                  <p className="text-2xl font-bold text-violet-400">10:1</p>
                  <p className="text-[10px] text-gray-600">payout / premium</p>
                </div>
              </div>

              <button
                onClick={checkout}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-lg font-bold text-white transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.01]"
              >
                🛡️ Purchase Coverage — ${(quote.totalCents / 100).toFixed(2)}
              </button>

              <p className="mt-3 text-center text-[10px] font-mono text-gray-700 tracking-wider">
                Powered by Stripe · Test mode · Parametric trigger: CDM Pc &gt; 0.001
              </p>
            </GlassCard>
          )}
        </>
      )}

      {/* ═══ ACTIVE POLICIES ═══════════════════════════════════════ */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-300">Active Policies</h2>
          <div className="accent-line flex-1" />
          {policies.length > 0 && (
            <span className="text-xs font-mono text-gray-600">{policies.length} active</span>
          )}
        </div>

        {policies.length === 0 ? (
          <GlassCard className="py-12 text-center">
            <div className="text-4xl mb-4 opacity-30">📋</div>
            <p className="text-gray-400 font-medium">No active coverage policies</p>
            <p className="mt-1 text-sm text-gray-600">Purchase coverage above to protect your fleet</p>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/[0.06]">
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Satellite</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Coverage Period</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Hourly Premium</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Max Payout</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {policies.map((pol) => (
                    <tr key={pol.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{pol.satellite_name}</span>
                        <span className="ml-2 text-[10px] font-mono text-gray-600">NORAD {pol.norad_id}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono tabular-nums text-gray-400">
                        {new Date(pol.coverage_start).toLocaleDateString()} → {pol.coverage_end ? new Date(pol.coverage_end).toLocaleDateString() : "Ongoing"}
                      </td>
                      <td className="px-6 py-4 tabular-nums">${(pol.hourly_premium_cents / 100).toFixed(2)}/hr</td>
                      <td className="px-6 py-4 tabular-nums text-emerald-400">${(pol.max_payout_cents / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pol.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-gray-500/15 text-gray-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            pol.status === "active" ? "bg-emerald-400" : "bg-gray-500"
                          }`} />
                          {pol.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </section>
    </div>
  );
}
