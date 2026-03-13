"use client";

/**
 * NebulaBackground — Cinematic space atmosphere.
 * 3 animated gradient orbs + scan grid + star field + deep vignette.
 * Pure CSS — zero JS overhead.
 */
export default function NebulaBackground() {
  return (
    <div className="nebula-bg fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Animated gradient orbs */}
      <div className="orb orb-indigo" />
      <div className="orb orb-violet" />
      <div className="orb orb-cyan" />

      {/* Scan grid overlay */}
      <div className="scan-grid absolute inset-0" />

      {/* Star field layers */}
      <div className="stars-sm absolute inset-0" />
      <div className="stars-md absolute inset-0" />

      {/* Deep vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(6,9,18,0.7)_50%,rgb(6,9,18)_85%)]" />

      {/* Top/bottom fade bands */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#060912] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#060912] to-transparent" />
    </div>
  );
}
