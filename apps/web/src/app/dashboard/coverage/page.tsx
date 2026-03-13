/* Coverage Marketplace — collision risk micro-insurance */
"use client";

import { useState, useEffect } from "react";
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
    try {
      const q = await coverageApi.quote(selectedSat, hours);
      setQuote(q);
    } catch (err) {
      console.error(err);
    }
  }

  async function checkout() {
    if (!selectedSat) return;
    try {
      const session = await coverageApi.checkout(selectedSat, hours);
      if (session.url) window.location.href = session.url;
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coverage Marketplace</h1>
        <p className="mt-1 text-gray-400">Parametric collision micro-coverage — powered by Stripe</p>
      </div>

      {/* Quote Builder */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-8">
        <h2 className="text-xl font-semibold mb-6">Get a Coverage Quote</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Select Satellite</label>
            <select
              value={selectedSat}
              onChange={(e) => { setSelectedSat(e.target.value); setQuote(null); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Choose satellite...</option>
              {satellites.map((sat) => (
                <option key={sat.id} value={sat.id}>{sat.name} (NORAD {sat.norad_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Coverage Duration</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="720"
                value={hours}
                onChange={(e) => { setHours(parseInt(e.target.value)); setQuote(null); }}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-lg font-bold text-white w-20 text-right">{hours}h</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{(hours / 24).toFixed(1)} days</p>
          </div>

          <div className="flex items-end">
            <button
              onClick={getQuote}
              disabled={!selectedSat}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Get Quote
            </button>
          </div>
        </div>

        {/* Quote Result */}
        {quote && (
          <div className="mt-8 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
              <div>
                <p className="text-sm text-gray-400">Hourly Rate</p>
                <p className="text-2xl font-bold text-white">${(quote.hourlyCents / 100).toFixed(2)}/hr</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-indigo-400">${(quote.totalCents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Max Payout</p>
                <p className="text-2xl font-bold text-emerald-400">${(quote.maxPayoutCents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Coverage Ratio</p>
                <p className="text-2xl font-bold text-violet-400">10:1</p>
              </div>
            </div>

            <button
              onClick={checkout}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-lg font-bold text-white transition-all hover:shadow-xl hover:shadow-indigo-500/25"
            >
              🛡️ Purchase Coverage — ${(quote.totalCents / 100).toFixed(2)}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              Powered by Stripe · Test mode · Parametric trigger: CDM Pc &gt; 0.001
            </p>
          </div>
        )}
      </div>

      {/* Active Policies */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold mb-4">Active Policies</h2>
        {policies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active coverage policies</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Satellite</th>
                  <th className="pb-3 font-medium">Coverage Period</th>
                  <th className="pb-3 font-medium">Hourly Premium</th>
                  <th className="pb-3 font-medium">Max Payout</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {policies.map((pol) => (
                  <tr key={pol.id} className="border-b border-white/5">
                    <td className="py-3">{pol.satellite_name} (NORAD {pol.norad_id})</td>
                    <td className="py-3 text-xs">{new Date(pol.coverage_start).toLocaleDateString()} → {pol.coverage_end ? new Date(pol.coverage_end).toLocaleDateString() : "Ongoing"}</td>
                    <td className="py-3">${(pol.hourly_premium_cents / 100).toFixed(2)}/hr</td>
                    <td className="py-3">${(pol.max_payout_cents / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${pol.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                        {pol.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
