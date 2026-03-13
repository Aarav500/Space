"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

interface SatellitePoint {
  id: string;
  name: string;
  norad_id: number;
  lat: number;
  lng: number;
  alt?: number;       // km altitude (default 420)
  velocity?: number;  // km/s
  risk_level: string;
  current_risk_score?: number;
  orbit_type?: string;
}

interface OrbitalGlobeProps {
  satellites: SatellitePoint[];
  onSatelliteClick?: (id: string) => void;
  selectedId?: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Constants + Helpers
   ═══════════════════════════════════════════════════════════════════════ */

const EARTH_RADIUS = 2;

const riskColorMap: Record<string, string> = {
  nominal: "#10b981",
  elevated: "#f59e0b",
  warning: "#f97316",
  critical: "#ef4444",
};

const riskGlowIntensity: Record<string, number> = {
  nominal: 0.15,
  elevated: 0.25,
  warning: 0.35,
  critical: 0.55,
};

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Altitude → sphere radius */
function altToRadius(alt: number = 420): number {
  // Scale: LEO ~2.05, MEO ~2.3, GEO ~2.8
  return EARTH_RADIUS + 0.03 + Math.min((alt / 36000) * 0.8, 0.8);
}

/** Altitude → marker size */
function altToMarkerSize(alt: number = 420, risk: string): number {
  const base = 0.02 + (alt / 36000) * 0.04; // LEO=0.02, GEO=0.06
  return risk === "critical" ? base * 1.5 : risk === "warning" ? base * 1.25 : base;
}

/* ═══════════════════════════════════════════════════════════════════════
   Earth + Atmosphere
   ═══════════════════════════════════════════════════════════════════════ */

function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.03;
    if (atmosRef.current) atmosRef.current.rotation.y += delta * 0.015;
  });

  return (
    <group>
      {/* Dark Earth sphere */}
      <Sphere ref={meshRef} args={[EARTH_RADIUS, 64, 64]}>
        <meshStandardMaterial
          color="#050a18"
          emissive="#0a1632"
          emissiveIntensity={0.5}
          roughness={0.9}
          metalness={0.1}
        />
      </Sphere>

      {/* Continent outlines (wireframe subtlety) */}
      <Sphere args={[EARTH_RADIUS + 0.002, 48, 48]}>
        <meshBasicMaterial color="#1e40af" wireframe transparent opacity={0.035} />
      </Sphere>

      {/* Inner atmosphere */}
      <Sphere args={[EARTH_RADIUS + 0.06, 48, 48]}>
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.02} side={THREE.BackSide} />
      </Sphere>

      {/* Outer atmosphere halo */}
      <Sphere ref={atmosRef} args={[EARTH_RADIUS + 0.15, 48, 48]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.025} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Grid Lines (every 30° lat, 45° lng)
   ═══════════════════════════════════════════════════════════════════════ */

function GridLines() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[][] = [];
    const r = EARTH_RADIUS + 0.008;

    for (let lat = -60; lat <= 60; lat += 30) {
      const line: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 3) line.push(latLngToVector3(lat, lng, r));
      points.push(line);
    }
    for (let lng = -180; lng < 180; lng += 45) {
      const line: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) line.push(latLngToVector3(lat, lng, r));
      points.push(line);
    }
    return points;
  }, []);

  return (
    <>
      {geometry.map((pts, i) => (
        <line key={`grid-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#1e3a5f" transparent opacity={0.08} />
        </line>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Orbital Rings
   ═══════════════════════════════════════════════════════════════════════ */

function OrbitalRing({ radius, color, opacity = 0.04 }: { radius: number; color: string; opacity?: number }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    return new Float32Array(pts);
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geo, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Individual Satellite Marker — hover, click, glow, pulse
   ═══════════════════════════════════════════════════════════════════════ */

function SatMarker({
  sat,
  isSelected,
  onHover,
  onUnhover,
  onClick,
}: {
  sat: SatellitePoint;
  isSelected: boolean;
  onHover: (sat: SatellitePoint) => void;
  onUnhover: () => void;
  onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const radius = altToRadius(sat.alt);
  const pos = useMemo(() => latLngToVector3(sat.lat, sat.lng, radius), [sat.lat, sat.lng, radius]);
  const color = riskColorMap[sat.risk_level] || "#6366f1";
  const markerSize = altToMarkerSize(sat.alt, sat.risk_level);
  const isCritical = sat.risk_level === "critical" || sat.risk_level === "warning";

  // Pulse animation for critical/warning, hover scale
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const pulse = isCritical
        ? 0.15 + Math.sin(clock.elapsedTime * (sat.risk_level === "critical" ? 8 : 4)) * 0.1
        : riskGlowIntensity[sat.risk_level] || 0.15;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    if (groupRef.current) {
      const target = hovered ? 1.5 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
      const targetOpacity = isSelected ? 0.6 : 0;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity +=
        (targetOpacity - (ringRef.current.material as THREE.MeshBasicMaterial).opacity) * 0.1;
    }
  });

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    onHover(sat);
    document.body.style.cursor = "pointer";
  }, [sat, onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onUnhover();
    document.body.style.cursor = "auto";
  }, [onUnhover]);

  return (
    <group ref={groupRef} position={pos}>
      {/* Core marker */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => { e.stopPropagation(); onClick(sat.id); }}
      >
        <sphereGeometry args={[markerSize, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[markerSize * 2.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Outer pulse (critical/warning only) */}
      {isCritical && (
        <mesh>
          <sphereGeometry args={[markerSize * 4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.05} />
        </mesh>
      )}

      {/* Selection ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[markerSize * 3.5, markerSize * 4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Persistent label for selected or hovered */}
      {(isSelected || hovered) && (
        <Html position={[0, markerSize * 6, 0]} center style={{ pointerEvents: "none" }} distanceFactor={6}>
          <div className="whitespace-nowrap rounded-lg bg-[#060912]/90 border border-white/[0.08] px-2.5 py-1 text-[9px] font-mono font-medium text-gray-200 backdrop-blur-xl shadow-lg shadow-black/40">
            <span className="text-white">{sat.name}</span>
            <span className="ml-2 text-gray-600">#{sat.norad_id}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   All Satellite Markers
   ═══════════════════════════════════════════════════════════════════════ */

function SatelliteMarkers({
  satellites,
  selectedId,
  filter,
  onHover,
  onUnhover,
  onClick,
}: {
  satellites: SatellitePoint[];
  selectedId: string | null;
  filter: string;
  onHover: (sat: SatellitePoint) => void;
  onUnhover: () => void;
  onClick: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    if (filter === "all") return satellites;
    if (filter === "risk") return satellites.filter((s) => s.risk_level === "critical" || s.risk_level === "warning");
    return satellites; // "tracked" = default
  }, [satellites, filter]);

  return (
    <>
      {filtered.map((sat) => (
        <SatMarker
          key={sat.id}
          sat={sat}
          isSelected={sat.id === selectedId}
          onHover={onHover}
          onUnhover={onUnhover}
          onClick={onClick}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Stars Background
   ═══════════════════════════════════════════════════════════════════════ */

function Stars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const r = 15 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.03} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Click-away deselect handler
   ═══════════════════════════════════════════════════════════════════════ */

function Deselect({ onDeselect }: { onDeselect: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const handler = () => onDeselect();
    gl.domElement.addEventListener("pointerdown", handler);
    return () => gl.domElement.removeEventListener("pointerdown", handler);
  }, [gl, onDeselect]);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Tooltip Overlay (HTML, follows cursor)
   ═══════════════════════════════════════════════════════════════════════ */

function Tooltip({ sat }: { sat: SatellitePoint | null }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!sat) return;
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [sat]);

  if (!sat) return null;

  const color = riskColorMap[sat.risk_level] || "#6366f1";

  return (
    <div
      className="pointer-events-none fixed z-[100]"
      style={{ left: pos.x + 16, top: pos.y - 10 }}
    >
      <div className="rounded-2xl border border-white/[0.08] bg-[#060912]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black/50 min-w-[240px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="text-sm font-semibold text-white">{sat.name}</span>
          <span className="text-[10px] font-mono text-gray-600">NORAD {sat.norad_id}</span>
        </div>

        <div className="h-px bg-white/[0.06] mb-3" />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
          <div>
            <span className="text-gray-600">Risk</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-white tabular-nums">
                {Number(sat.current_risk_score || 0).toExponential(2)}
              </span>
              <span className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider`}
                style={{ backgroundColor: `${color}20`, color }}>
                {sat.risk_level}
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-600">Altitude</span>
            <p className="font-mono text-white mt-0.5 tabular-nums">{sat.alt || 420} km</p>
          </div>

          <div>
            <span className="text-gray-600">Position</span>
            <p className="font-mono text-white mt-0.5 tabular-nums">
              {sat.lat.toFixed(1)}° / {sat.lng.toFixed(1)}°
            </p>
          </div>

          <div>
            <span className="text-gray-600">Orbit</span>
            <p className="font-mono text-white mt-0.5">{sat.orbit_type || "LEO"}</p>
          </div>

          {sat.velocity && (
            <div className="col-span-2">
              <span className="text-gray-600">Velocity</span>
              <p className="font-mono text-white mt-0.5 tabular-nums">{sat.velocity} km/s</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Controls Panel (top-right overlay)
   ═══════════════════════════════════════════════════════════════════════ */

function ControlsPanel({
  filter,
  setFilter,
  satelliteCount,
  filteredCount,
}: {
  filter: string;
  setFilter: (f: string) => void;
  satelliteCount: number;
  filteredCount: number;
}) {
  const filters = [
    { key: "all", label: "All" },
    { key: "tracked", label: "Tracked" },
    { key: "risk", label: "Risk Only" },
  ];

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="rounded-xl border border-white/[0.06] bg-[#060912]/80 backdrop-blur-2xl p-3 shadow-xl shadow-black/30 space-y-3 min-w-[160px]">
        {/* Filter buttons */}
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider transition-all duration-200 ${
                filter === f.key
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-600 hover:text-gray-400 border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Legend */}
        <div className="space-y-1.5">
          <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-gray-700">Risk Levels</p>
          {Object.entries(riskColorMap).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}40` }} />
              <span className="text-[10px] text-gray-500 capitalize">{level}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Count */}
        <p className="text-[9px] font-mono text-gray-600 text-center">
          {filteredCount} / {satelliteCount} visible
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Export — OrbitalGlobe
   ═══════════════════════════════════════════════════════════════════════ */

export default function OrbitalGlobe({ satellites, onSatelliteClick, selectedId: externalSelectedId }: OrbitalGlobeProps) {
  const [hoveredSat, setHoveredSat] = useState<SatellitePoint | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;

  // ESC to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInternalSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClick = useCallback((id: string) => {
    setInternalSelectedId((prev) => (prev === id ? null : id));
    onSatelliteClick?.(id);
  }, [onSatelliteClick]);

  const handleDeselect = useCallback(() => {
    // Only deselect if click was on empty space (handled by stopPropagation on markers)
  }, []);

  const filteredCount = useMemo(() => {
    if (filter === "risk") return satellites.filter((s) => s.risk_level === "critical" || s.risk_level === "warning").length;
    return satellites.length;
  }, [satellites, filter]);

  return (
    <div className="glass-card group relative h-[560px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl">
      <Canvas
        camera={{ position: [0, 1.5, 5.5], fov: 42 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Cinematic lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]} intensity={0.5} color="#4f7cff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.12} color="#8b5cf6" />
        <pointLight position={[0, 0, 4]} intensity={0.25} color="#3b82f6" distance={8} />

        {/* Earth + grid */}
        <EarthMesh />
        <GridLines />

        {/* Orbital altitude rings */}
        <OrbitalRing radius={altToRadius(400)} color="#6366f1" opacity={0.04} />
        <OrbitalRing radius={altToRadius(2000)} color="#8b5cf6" opacity={0.03} />
        <OrbitalRing radius={altToRadius(20200)} color="#0ea5e9" opacity={0.02} />
        <OrbitalRing radius={altToRadius(35786)} color="#a855f7" opacity={0.015} />

        {/* Satellite markers */}
        <SatelliteMarkers
          satellites={satellites}
          selectedId={selectedId ?? null}
          filter={filter}
          onHover={setHoveredSat}
          onUnhover={() => setHoveredSat(null)}
          onClick={handleClick}
        />

        {/* Stars */}
        <Stars />

        {/* Click-away deselect */}
        <Deselect onDeselect={handleDeselect} />

        {/* Camera controls */}
        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.2}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Controls panel */}
      <ControlsPanel
        filter={filter}
        setFilter={setFilter}
        satelliteCount={satellites.length}
        filteredCount={filteredCount}
      />

      {/* Hover tooltip */}
      <Tooltip sat={hoveredSat} />

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#060912]/90 to-transparent" />

      {/* Status bar */}
      <div className="absolute bottom-4 left-5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">
          Orbital View · Live
        </span>
      </div>
      <div className="absolute bottom-4 right-5 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">
        {satellites.length} object{satellites.length !== 1 ? "s" : ""} tracked
      </div>

      {/* Inner light edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}
