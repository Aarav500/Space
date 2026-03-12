"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "./motion";

const pipelineSteps = [
  {
    step: "01",
    label: "Idea",
    desc: "Describe your app in one sentence. The AI expands it into a full product spec.",
    color: "from-violet-500 to-purple-600",
  },
  {
    step: "02",
    label: "Spec",
    desc: "Structured spec with user stories, data model, API endpoints, and screens.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    step: "03",
    label: "Plan",
    desc: "10–20 task implementation plan — reviewed and approved before any code.",
    color: "from-indigo-500 to-blue-600",
  },
  {
    step: "04",
    label: "Backend",
    desc: "Express routes, Postgres models, tests — all in apps/api-node.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    step: "05",
    label: "Frontend",
    desc: "Next.js pages with Tailwind + Framer Motion — wired to backend APIs.",
    color: "from-cyan-500 to-teal-600",
  },
  {
    step: "06",
    label: "Deploy",
    desc: "Push to main → GitHub Actions → EC2 → PM2 restart. You\u2019re live.",
    color: "from-teal-500 to-emerald-600",
  },
];

export default function Pipeline() {
  const { fadeUp } = useMotionVariants();

  return (
    <section id="pipeline" className="relative z-10 max-w-4xl mx-auto px-6 pb-24 sm:pb-32">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          The <span className="gradient-text">AI Pipeline</span>
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          One workflow turns a short idea into a deployed full-stack app —
          with human review gates at every stage.
        </p>
      </motion.div>

      <div className="space-y-6">
        {pipelineSteps.map((s, i) => (
          <motion.div
            key={s.step}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="flex items-start gap-5"
          >
            <div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg`}
            >
              {s.step}
            </div>
            <div className="pt-1">
              <h3 className="font-semibold text-lg mb-1">{s.label}</h3>
              <p className="text-sm text-zinc-500">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
