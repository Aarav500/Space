"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "./motion";

const stackItems = [
  { label: "Next.js", color: "text-white" },
  { label: "React", color: "text-cyan-400" },
  { label: "TypeScript", color: "text-blue-400" },
  { label: "Tailwind", color: "text-teal-400" },
  { label: "Express", color: "text-yellow-400" },
  { label: "Postgres", color: "text-sky-400" },
  { label: "S3", color: "text-orange-400" },
  { label: "EC2 + PM2", color: "text-emerald-400" },
  { label: "Antigravity", color: "text-violet-400" },
];

const builderPoints = [
  {
    icon: "🧑‍💻",
    title: "Solo Developers",
    desc: "Go from idea to deployed app alone. AI handles the boilerplate; you focus on product.",
  },
  {
    icon: "👥",
    title: "Small Teams",
    desc: "Shared spec → plan workflow keeps everyone aligned. Review gates replace long standups.",
  },
  {
    icon: "🤖",
    title: "AI-Assisted Dev",
    desc: "Claude Code + Antigravity agents follow your rules. Spec-driven, plan-first, always review-gated.",
  },
];

export default function StackSection() {
  const { fadeUp, scaleIn, shouldAnimate } = useMotionVariants();

  return (
    <section id="stack" className="relative z-10 max-w-6xl mx-auto px-6 pb-24 sm:pb-32">
      {/* Stack tech labels */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          Built with the{" "}
          <span className="gradient-text">right stack</span>
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto mb-10">
          Modern, battle-tested technologies wired together so you can focus
          on building — not configuring.
        </p>

        <motion.div
          variants={fadeUp}
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {stackItems.map((item) => (
            <span
              key={item.label}
              className={`px-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-sm font-medium ${item.color} tracking-tight`}
            >
              {item.label}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* For builders */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="text-center mb-10"
      >
        <h3 className="text-2xl font-bold mb-2">For builders who ship</h3>
        <p className="text-zinc-500 text-sm">
          Whether you&apos;re solo or a team, this template meets you
          where you are.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-5">
        {builderPoints.map((bp, i) => (
          <motion.div
            key={bp.title}
            custom={i}
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            whileHover={shouldAnimate ? { y: -4, transition: { duration: 0.2 } } : undefined}
            className="glass rounded-xl p-6 text-center"
          >
            <div className="text-3xl mb-3">{bp.icon}</div>
            <h4 className="font-semibold mb-2">{bp.title}</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {bp.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
