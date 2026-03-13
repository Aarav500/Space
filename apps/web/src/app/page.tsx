"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

const features = [
  { icon: "🛰️", title: "Fleet Risk Dashboard", desc: "Monitor collision probability for your entire constellation in real-time with per-satellite risk scores and trend analysis." },
  { icon: "🤖", title: "ML Collision Predictions", desc: "72-hour risk forecasts powered by LSTM models trained on historical conjunction data, enhanced by space weather inputs." },
  { icon: "☀️", title: "Space Weather Integration", desc: "Live Kp index, F10.7 flux, and geomagnetic storm alerts from NOAA SWPC — automatically factored into risk models." },
  { icon: "🛡️", title: "Parametric Micro-Coverage", desc: "Purchase hourly collision coverage per satellite. Dynamic pricing reflects real-time risk. Powered by Stripe." },
  { icon: "🗺️", title: "Orbital Visualization", desc: "Interactive dark-mode map showing satellite positions, conjunction geometry, and risk event markers." },
  { icon: "⚡", title: "Real-Time Alerts", desc: "Instant notifications when collision probability exceeds your threshold. Email, webhook, and dashboard alerts." },
];

const dataSources = [
  { name: "CelesTrak", desc: "GP/TLE data + SOCRATES" },
  { name: "NOAA SWPC", desc: "Space weather" },
  { name: "Space-Track", desc: "CDM conjunction data" },
  { name: "ESA DISCOS", desc: "Debris catalog" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060912] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#060912]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">◎</div>
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-lg font-bold text-transparent">OrbitShield</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#data" className="hover:text-white transition-colors">Data Sources</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors">
            Launch Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/5 animate-[spin_60s_linear_infinite]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5 animate-[spin_45s_linear_infinite_reverse]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeIn}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live Risk Monitoring
            </span>
          </motion.div>

          <motion.h1
            className="mt-8 text-5xl font-bold tracking-tight md:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Satellite Collision
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Risk Intelligence
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Real-time collision probability monitoring for LEO constellations.
            ML-powered risk predictions. Hourly micro-coverage via Stripe.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link href="/dashboard" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-lg font-semibold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
              Start Monitoring — Free
            </Link>
            <a href="#features" className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold hover:bg-white/10 transition-all">
              See Features
            </a>
          </motion.div>

          {/* Live risk ticker */}
          <motion.div
            className="mt-16 flex items-center justify-center gap-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <span>ISS (25544) <span className="text-emerald-400 font-mono">Pc: 2.1e-7 ✓</span></span>
            <span className="text-white/10">|</span>
            <span>Starlink-1234 <span className="text-amber-400 font-mono">Pc: 4.8e-6 ▲</span></span>
            <span className="text-white/10">|</span>
            <span>GOES-16 <span className="text-emerald-400 font-mono">Pc: 1.3e-9 ✓</span></span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything You Need to Protect Your Constellation</h2>
          <p className="mt-4 text-gray-400">From data ingestion to coverage checkout — one platform.</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:bg-white/8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold group-hover:text-indigo-300 transition-colors">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section id="data" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Multi-Source Data Fusion</h2>
          <p className="mt-4 text-gray-400">Aggregating the world&apos;s best space situational awareness data.</p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {dataSources.map((src) => (
            <div key={src.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="font-semibold text-white">{src.name}</p>
                <p className="text-xs text-gray-500">{src.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Simple, Risk-Based Pricing</h2>
          <p className="mt-4 text-gray-400">Pay only for what you need. No lock-in contracts.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", desc: "Dashboard + 3 satellites", features: ["Risk monitoring", "CelesTrak data", "Email alerts", "3 tracked sats"] },
            { name: "Pro", price: "$99/mo", desc: "Full fleet analytics", features: ["Everything in Free", "Unlimited satellites", "ML risk forecasts", "API access", "Webhook alerts"], highlight: true },
            { name: "Coverage", price: "From $1/hr", desc: "Parametric micro-coverage", features: ["Everything in Pro", "Hourly coverage", "Dynamic pricing", "Stripe checkout", "10:1 payout ratio"] },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 ${plan.highlight ? "border-indigo-500/40 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : "border-white/10 bg-white/5"}`}>
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="mt-4 text-4xl font-bold">{plan.price}</p>
              <p className="mt-1 text-sm text-gray-400">{plan.desc}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className={`mt-8 block rounded-xl px-6 py-3 text-center font-medium transition-all ${plan.highlight ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-white/10 text-white hover:bg-white/5"}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
        <p>© 2026 OrbitShield · Satellite collision risk analytics · Built with Next.js, Express, and Stripe</p>
      </footer>
    </div>
  );
}
