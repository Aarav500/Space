"use client";

import { motion } from "framer-motion";
import { useMotionVariants, scaleIn } from "./motion";

const pipelineSteps = [
  { step: "01", label: "Idea", color: "from-violet-500 to-purple-600" },
  { step: "02", label: "Spec", color: "from-purple-500 to-indigo-600" },
  { step: "03", label: "Plan", color: "from-indigo-500 to-blue-600" },
  { step: "04", label: "Backend", color: "from-blue-500 to-cyan-600" },
  { step: "05", label: "Frontend", color: "from-cyan-500 to-teal-600" },
  { step: "06", label: "Deploy", color: "from-teal-500 to-emerald-600" },
];

export default function Hero() {
  const { fadeUp, shouldAnimate } = useMotionVariants();

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-24 sm:pb-32">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
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
            className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg"
          >
            A full-stack template with Next.js, Express, Postgres, and
            AI-driven automation. Describe your app, review the plan, and
            ship — the pipeline handles the rest.
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
              whileHover={shouldAnimate ? { scale: 1.04 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
            >
              See the Pipeline
            </motion.a>
            <motion.a
              href="#features"
              whileHover={shouldAnimate ? { scale: 1.04 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
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
          className="glass rounded-2xl p-6 glow hidden sm:block"
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
                initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
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
                    initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
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
  );
}
