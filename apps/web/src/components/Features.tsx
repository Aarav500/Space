"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "./motion";

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

export default function Features() {
  const { fadeUp, scaleIn, shouldAnimate } = useMotionVariants();

  return (
    <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 pb-24 sm:pb-32">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          Everything you need,{" "}
          <span className="text-zinc-500">nothing you don&apos;t.</span>
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          A production-shaped starting point with modern tooling, sensible
          defaults, and AI-driven development workflows built in.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            whileHover={shouldAnimate ? { y: -4, transition: { duration: 0.2 } } : undefined}
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
    </section>
  );
}
