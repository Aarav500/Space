"use client";

import { useState, useEffect } from "react";
import { weatherApi } from "@/lib/api";

interface SpaceWeatherData {
  kp: number;
  f107: number;
  stormLevel: string | null;
  timestamp: string;
}

export default function SpaceWeatherPage() {
  const [weather, setWeather] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWeather(); }, []);

  async function loadWeather() {
    try {
      const data = await weatherApi.current();
      setWeather(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const kp = weather?.kp ?? 0;
  const kpLevel = kp >= 7 ? "Extreme" : kp >= 5 ? "Strong" : kp >= 3 ? "Moderate" : "Quiet";
  const kpColor = kp >= 7 ? "text-red-400" : kp >= 5 ? "text-orange-400" : kp >= 3 ? "text-amber-400" : "text-emerald-400";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Space Weather</h1>
        <p className="mt-1 text-gray-400">NOAA Space Weather Prediction Center</p>
      </div>

      {/* Current Conditions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Kp Index */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-6">
          <h3 className="text-sm font-medium text-gray-400">Planetary Kp Index</h3>
          <p className={`mt-4 text-5xl font-bold ${kpColor}`}>
            {weather?.kp?.toFixed(1) || "—"}
          </p>
          <p className={`mt-2 text-sm ${kpColor}`}>{kpLevel}</p>
          {/* Kp gauge */}
          <div className="mt-4 h-2 w-full rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all"
              style={{ width: `${((weather?.kp || 0) / 9) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0</span><span>3</span><span>5</span><span>7</span><span>9</span>
          </div>
        </div>

        {/* Solar Flux */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-6">
          <h3 className="text-sm font-medium text-gray-400">Solar Radio Flux F10.7</h3>
          <p className="mt-4 text-5xl font-bold text-amber-400">
            {weather?.f107?.toFixed(0) || "—"}
          </p>
          <p className="mt-2 text-sm text-amber-400/60">sfu</p>
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl" />
        </div>

        {/* Storm Level */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-6">
          <h3 className="text-sm font-medium text-gray-400">Geomagnetic Storm</h3>
          <p className="mt-4 text-5xl font-bold text-violet-400">
            {weather?.stormLevel || "None"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {weather?.stormLevel ? "⚠️ Storm active — increased LEO drag" : "✅ Normal conditions"}
          </p>
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl" />
        </div>
      </div>

      {/* Impact on LEO */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold mb-4">Impact on LEO Satellites</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌊</span>
              <div>
                <p className="text-sm font-medium text-white">Atmospheric Drag</p>
                <p className="text-xs text-gray-400">
                  {kp >= 5 ? "Significantly elevated — orbit decay acceleration expected" : "Normal levels"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <p className="text-sm font-medium text-white">TLE Accuracy</p>
                <p className="text-xs text-gray-400">
                  {kp >= 5 ? "Degraded — position predictions less reliable" : "Standard accuracy (~1km)"}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-medium text-white">Surface Charging</p>
                <p className="text-xs text-gray-400">
                  {kp >= 7 ? "High risk of satellite component charging" : "Low risk"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm font-medium text-white">Collision Risk Modifier</p>
                <p className="text-xs text-gray-400">
                  Risk scores inflated by {((1 + (weather?.kp || 0) / 9 * 0.5 - 1) * 100).toFixed(0)}% due to space weather
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Data source: NOAA Space Weather Prediction Center · Last updated: {weather?.timestamp ? new Date(weather.timestamp).toLocaleString() : "—"}
      </p>
    </div>
  );
}
