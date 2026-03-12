"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "@/components/motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import StackSection from "@/components/StackSection";
import Pipeline from "@/components/Pipeline";
import Footer from "@/components/Footer";

export default function Home() {
  const { scaleIn, shouldAnimate } = useMotionVariants();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-fade pointer-events-none" />

      <Navbar />
      <Hero />
      <Features />
      <StackSection />
      <Pipeline />

      {/* ─── CTA ─── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 sm:pb-32">
        <motion.div
          variants={scaleIn}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="glass rounded-2xl p-8 sm:p-12 text-center glow"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Clone the template, run the workflow, and ship your next idea —
            with AI doing the heavy lifting and you in the driver&apos;s seat.
          </p>
          <motion.div
            whileHover={shouldAnimate ? { scale: 1.04 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
            className="inline-block"
          >
            <code className="block px-6 py-3 rounded-xl bg-zinc-800 text-violet-300 font-mono text-sm border border-zinc-700/50 hover:border-violet-500/30 transition-colors cursor-pointer">
              npx degit your-org/fullstack-template my-app
            </code>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
