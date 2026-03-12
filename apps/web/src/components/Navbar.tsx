"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#stack", label: "Stack" },
  { href: "#pipeline", label: "Pipeline" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  /* Close on ESC */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* Prevent body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-50 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto"
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
          F
        </div>
        <span className="font-semibold text-lg tracking-tight">
          fullstack<span className="text-zinc-500">-template</span>
        </span>
      </a>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hover:text-zinc-100 transition-colors"
          >
            {l.label}
          </a>
        ))}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/50"
        >
          GitHub →
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="md:hidden relative z-50 flex flex-col gap-1.5 p-2"
      >
        <motion.span
          animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          className="block h-0.5 w-6 bg-zinc-300 origin-center"
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          className="block h-0.5 w-6 bg-zinc-300"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          className="block h-0.5 w-6 bg-zinc-300 origin-center"
        />
      </button>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />

            {/* Slide-down panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 right-0 z-40 md:hidden glass border-b border-zinc-800/50 pt-20 pb-8 px-6"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="text-lg font-medium text-zinc-200 hover:text-white transition-colors py-2"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="mt-2 px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-center transition-colors border border-zinc-700/50"
                >
                  GitHub →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
