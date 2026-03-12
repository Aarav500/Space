"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

/* ─────────────────────────── animation variants ──────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

/* ──────────────────────── reusable section wrapper ────────────────────── */
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className={className}>
      {inView && children}
    </section>
  );
}

/* ────────────────────────────── features data ────────────────────────── */
const features = [
  {
    icon: "⚡",
    title: "Next.js + Tailwind",
    desc: "App Router, TypeScript, server components, and utility-first styling out of the box.",
  },
  {
    icon: "🔧",
    title: "Express API",
    desc: "Modular REST backend with Postgres, health checks, and structured error handling.",
  },
  {
    icon: "🤖",
    title: "AI-First Workflow",
    desc: "Spec → Plan → Code → Verify loop. One command turns an idea into a full-stack app.",
  },
  {
    icon: "🚀",
    title: "CI/CD to EC2",
    desc: "Push to main, GitHub Actions SSHs to EC2, runs deploy.sh, PM2 restarts — done.",
  },
  {
    icon: "🎨",
    title: "Framer Motion",
    desc: "Production-grade micro-interactions and page transitions built into every component.",
  },
  {
    icon: "🔒",
    title: "Best Practices",
    desc: "Env-based secrets, TypeScript strict, ESLint, spec-driven development from day one.",
  },
];

/* ─────────────────────── pipeline steps ──────────────────────────────── */
const pipelineSteps = [
  { step: "01", label: "Idea", color: "from-violet-500 to-purple-600" },
  { step: "02", label: "Spec", color: "from-purple-500 to-indigo-600" },
  { step: "03", label: "Plan", color: "from-indigo-500 to-blue-600" },
  { step: "04", label: "Backend", color: "from-blue-500 to-cyan-600" },
  { step: "05", label: "Frontend", color: "from-cyan-500 to-teal-600" },
  { step: "06", label: "Deploy", color: "from-teal-500 to-emerald-600" },
];

/* ══════════════════════════════ PAGE ══════════════════════════════════ */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-fade pointer-events-none" />

      {/* ─── Navbar ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
            F
          </div>
          <span className="font-semibold text-lg tracking-tight">
            fullstack<span className="text-zinc-500">-template</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">
            Features
          </a>
          <a href="#pipeline" className="hover:text-zinc-100 transition-colors">
            Pipeline
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/50"
          >
            GitHub →
          </a>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Spec-driven · Plan-first · AI-powered
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            >
              From idea to{" "}
              <span className="gradient-text">production</span>
              <br />
              in one workflow.
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg"
            >
              A full-stack template with Next.js, Express, Postgres, and
              AI-driven automation. Describe your app, review the plan, and ship — the
              pipeline handles the rest.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-4"
            >
              <motion.a
                href="#pipeline"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
              >
                See the Pipeline
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl bg-zinc-800/80 text-zinc-300 font-medium border border-zinc-700/50 hover:border-zinc-600 transition-colors"
              >
                Explore Features
              </motion.a>
            </motion.div>
          </div>

          {/* Right: Pipeline visual card */}
          <motion.div
            custom={2}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass rounded-2xl p-6 glow"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-zinc-500 font-mono">
                new-app-from-idea.md
              </span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              {pipelineSteps.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-xs font-bold text-white/90 shrink-0`}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                  <span className="text-zinc-300">{s.label}</span>
                  {i < pipelineSteps.length - 1 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 + i * 0.15 }}
                      className="text-zinc-600 text-xs"
                    >
                      → review
                    </motion.span>
                  )}
                  {i === pipelineSteps.length - 1 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.8, type: "spring", bounce: 0.5 }}
                      className="text-emerald-400 text-xs font-semibold"
                    >
                      ✓ live
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <Section className="relative z-10 max-w-6xl mx-auto px-6 pb-32" >
        <div id="features">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need,{" "}
              <span className="text-zinc-500">nothing you don&apos;t.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              A production-shaped starting point with modern tooling, sensible defaults,
              and AI-driven development workflows built in.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-xl p-6 group cursor-default"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Pipeline breakdown ─── */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <div id="pipeline">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              The <span className="gradient-text">AI Pipeline</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              One workflow turns a short idea into a deployed full-stack app — with human
              review gates at every stage.
            </p>
          </motion.div>

          <div className="space-y-6">
            {pipelineSteps.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex items-start gap-5"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg`}
                >
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg mb-1">{s.label}</h3>
                  <p className="text-sm text-zinc-500">
                    {
                      [
                        "Describe your app in one sentence. The AI expands it into a full product spec.",
                        "Structured spec with user stories, data model, API endpoints, and screens.",
                        "10–20 task implementation plan — reviewed and approved before any code.",
                        "Express routes, Postgres models, tests — all in apps/api-node.",
                        "Next.js pages with Tailwind + Framer Motion — wired to backend APIs.",
                        "Push to main → GitHub Actions → EC2 → PM2 restart. You're live.",
                      ][i]
                    }
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.div
          variants={scaleIn}
          custom={0}
          initial="hidden"
          animate="visible"
          className="glass rounded-2xl p-12 text-center glow"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Clone the template, run the workflow, and ship your next idea — with
            AI doing the heavy lifting and you in the driver&apos;s seat.
          </p>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <code className="block px-6 py-3 rounded-xl bg-zinc-800 text-violet-300 font-mono text-sm border border-zinc-700/50 hover:border-violet-500/30 transition-colors cursor-pointer">
              npx degit your-org/fullstack-template my-app
            </code>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-600">
          <span>fullstack-template · {new Date().getFullYear()}</span>
          <span>Built with Next.js · Express · ♥</span>
        </div>
      </footer>
    </div>
  );
}
