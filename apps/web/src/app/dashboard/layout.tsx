"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import NebulaBackground from "@/components/NebulaBackground";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📡" },
  { href: "/dashboard/space-weather", label: "Space Weather", icon: "☀️" },
  { href: "/dashboard/coverage", label: "Coverage", icon: "🛡️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

/* ═══════════════════════════════════════════════════════════════════════
   AUTH GATE — login / register form shown when user is not authenticated
   ═══════════════════════════════════════════════════════════════════════ */

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <NebulaBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full" />
          <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">
            Initializing OrbitShield
          </span>
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, orgName);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <NebulaBackground />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="logo-breathe mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold shadow-[0_0_40px_-8px_rgba(99,102,241,0.4)]">
            ◎
          </div>
          <h1 className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-2xl font-bold text-transparent">
            OrbitShield
          </h1>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-600">
            Command Center
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(99,102,241,0.1)]">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-white/[0.03] p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300 ${
                mode === "login"
                  ? "bg-indigo-500/15 text-indigo-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300 ${
                mode === "register"
                  ? "bg-indigo-500/15 text-indigo-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
                  Organization
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="OrbitShield HQ"
                  required
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition-all duration-300 focus:border-indigo-500/30 focus:bg-white/[0.04] focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)]"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@orbitshield.io"
                required
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition-all duration-300 focus:border-indigo-500/30 focus:bg-white/[0.04] focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition-all duration-300 focus:border-indigo-500/30 focus:bg-white/[0.04] focus:shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5">
                <div className="h-2 w-2 rounded-full bg-red-500 led-pulse flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  {mode === "login" ? "Authenticating…" : "Creating account…"}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Footer hint */}
          <p className="mt-5 text-center text-[10px] font-mono text-gray-700 tracking-wider">
            {mode === "login"
              ? "Don't have an account? Click Register above"
              : "Min 8 characters for password"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════════════ */

function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/[0.04] bg-[#060912]/70 backdrop-blur-2xl">
      {/* Gradient accent rail — left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/60 via-violet-500/40 to-cyan-500/20" />

      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-6 py-5">
        <div className="logo-breathe flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold">
          ◎
        </div>
        <div>
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-lg font-bold text-transparent">
            OrbitShield
          </span>
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-gray-600">
            Command Center
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_-4px_rgba(99,102,241,0.15)]"
                  : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
              }`}
            >
              <span className={`text-base transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"}`}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 led-pulse" />
              )}
            </Link>
          );
        })}

        {/* Section separator */}
        <div className="accent-line mx-3 my-4" />

        {/* System label */}
        <p className="px-4 text-[9px] font-mono uppercase tracking-[0.2em] text-gray-700">
          System
        </p>
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.04] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-sm text-indigo-300 ring-1 ring-indigo-500/20">
            {user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-gray-300">{user?.email || "—"}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-600">{user?.role || "operator"}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-gray-600 transition-all hover:bg-red-500/10 hover:text-red-400" title="Logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LAYOUT — wraps everything in AuthProvider + AuthGate
   ═══════════════════════════════════════════════════════════════════════ */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="min-h-screen text-white">
          <NebulaBackground />
          <DashboardSidebar />
          <main className="relative z-0 ml-64 min-h-screen p-8">
            {children}
          </main>
        </div>
      </AuthGate>
    </AuthProvider>
  );
}

