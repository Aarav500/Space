"use client";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen text-white">
        <NebulaBackground />
        <DashboardSidebar />
        <main className="relative z-0 ml-64 min-h-screen p-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
