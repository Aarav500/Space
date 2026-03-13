"use client";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-gray-400">Manage your organization, API keys, and alerts</p>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        {/* API Keys */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-gray-400 mb-4">
            Use API keys to access the <code className="text-indigo-400">GET /api/v1/risk-score/:noradId</code> endpoint.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value="os_live_••••••••••••••••"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-400 font-mono"
            />
            <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
              Generate New
            </button>
          </div>
        </div>

        {/* Alert Configuration */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Alert Thresholds</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Collision Probability Threshold</p>
                <p className="text-xs text-gray-500">Alert when Pc exceeds this value</p>
              </div>
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
                <option value="1e-4">1×10⁻⁴ (Critical)</option>
                <option value="1e-5">1×10⁻⁵ (Warning)</option>
                <option value="1e-6">1×10⁻⁶ (Elevated)</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Notification Channels</p>
                <p className="text-xs text-gray-500">How to receive alerts</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs text-indigo-300">📧 Email</span>
                <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 cursor-pointer hover:bg-white/10">🔗 Webhook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
          <div className="space-y-3">
            {[
              { name: "CelesTrak", status: "active", desc: "GP/TLE orbital data + SOCRATES conjunction reports", interval: "Every 4h" },
              { name: "NOAA SWPC", status: "active", desc: "Kp index, F10.7 flux, geomagnetic alerts", interval: "Every 30m" },
              { name: "Space-Track", status: "inactive", desc: "High-fidelity CDMs with covariance data", interval: "Requires account" },
            ].map((src) => (
              <div key={src.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${src.status === "active" ? "bg-emerald-400" : "bg-gray-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{src.name}</p>
                    <p className="text-xs text-gray-500">{src.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{src.interval}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
