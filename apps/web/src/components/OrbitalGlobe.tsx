"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

/* ─── Types ────────────────────────────────────────────────────────── */

interface SatellitePoint {
  id: string;
  name: string;
  norad_id: number;
  lat: number;
  lng: number;
  risk_level: string;
}

interface OrbitalGlobeProps {
  satellites: SatellitePoint[];
  onSatelliteClick?: (id: string) => void;
}

/* ─── Color mapping ────────────────────────────────────────────────── */

const riskColorMap: Record<string, string> = {
  nominal: "#10b981",
  elevated: "#f59e0b",
  warning: "#f97316",
  critical: "#ef4444",
};

/* ─── Lat/Lng → 3D position on sphere ─────────────────────────────── */

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ─── Earth globe mesh with atmosphere ─────────────────────────────── */

function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
    }
    if (atmosRef.current) {
      atmosRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Core Earth */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#080e1f"
          emissive="#0d1f3c"
          emissiveIntensity={0.4}
          roughness={0.85}
          metalness={0.15}
        />
      </Sphere>

      {/* Wireframe grid */}
      <Sphere args={[2.003, 48, 48]}>
        <meshBasicMaterial
          color="#1e40af"
          wireframe
          transparent
          opacity={0.04}
        />
      </Sphere>

      {/* Atmosphere halo — outer glow ring */}
      <Sphere ref={atmosRef} args={[2.15, 48, 48]}>
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Atmosphere inner glow */}
      <Sphere args={[2.08, 48, 48]}>
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.015}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

/* ─── Grid lines (latitude/longitude) ──────────────────────────────── */

function GridLines() {
  const lines = useMemo(() => {
    const points: THREE.Vector3[][] = [];

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const linePoints: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        linePoints.push(latLngToVector3(lat, lng, 2.01));
      }
      points.push(linePoints);
    }

    // Longitude lines
    for (let lng = -180; lng < 180; lng += 45) {
      const linePoints: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        linePoints.push(latLngToVector3(lat, lng, 2.01));
      }
      points.push(linePoints);
    }

    return points;
  }, []);

  return (
    <>
      {lines.map((pts, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#1e3a5f" transparent opacity={0.12} />
        </line>
      ))}
    </>
  );
}

/* ─── Orbital rings at satellite altitudes ─────────────────────────── */

function OrbitalRing({ radius, color, opacity = 0.06 }: { radius: number; color: string; opacity?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/* ─── Satellite markers with glow ──────────────────────────────────── */

function SatelliteMarkers({
  satellites,
  onSatelliteClick,
}: {
  satellites: SatellitePoint[];
  onSatelliteClick?: (id: string) => void;
}) {
  return (
    <>
      {satellites.map((sat) => {
        const pos = latLngToVector3(sat.lat, sat.lng, 2.06);
        const color = riskColorMap[sat.risk_level] || "#6366f1";

        return (
          <group key={sat.id} position={pos}>
            {/* Core dot */}
            <mesh onClick={() => onSatelliteClick?.(sat.id)}>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Inner glow ring */}
            <mesh>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.25}
              />
            </mesh>

            {/* Outer glow (critical only) */}
            {sat.risk_level === "critical" && (
              <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.1}
                />
              </mesh>
            )}

            {/* Label */}
            <Html
              position={[0, 0.1, 0]}
              center
              style={{ pointerEvents: "none" }}
              distanceFactor={8}
            >
              <div className="whitespace-nowrap rounded-md bg-[#060912]/80 border border-white/[0.06] px-2 py-0.5 text-[8px] font-mono font-medium text-gray-300 backdrop-blur-sm shadow-lg">
                {sat.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

/* ─── Background stars ─────────────────────────────────────────────── */

function Stars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      const r = 12 + Math.random() * 30;
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
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ─── Main component ───────────────────────────────────────────────── */

export default function OrbitalGlobe({ satellites, onSatelliteClick }: OrbitalGlobeProps) {
  return (
    <div className="glass-card group relative h-[520px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl">
      <Canvas
        camera={{ position: [0, 1.2, 5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting — cinematic blue-violet setup */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} color="#4f7cff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.15} color="#8b5cf6" />
        <pointLight position={[0, 0, 4]} intensity={0.3} color="#3b82f6" distance={8} />

        {/* Earth + Atmosphere */}
        <EarthMesh />
        <GridLines />

        {/* Orbital rings */}
        <OrbitalRing radius={2.5} color="#6366f1" opacity={0.05} />
        <OrbitalRing radius={3.0} color="#8b5cf6" opacity={0.03} />
        <OrbitalRing radius={3.5} color="#0ea5e9" opacity={0.02} />

        {/* Satellites */}
        <SatelliteMarkers satellites={satellites} onSatelliteClick={onSatelliteClick} />

        {/* Background stars */}
        <Stars />

        {/* Controls */}
        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={3.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.25}
          dampingFactor={0.06}
        />
      </Canvas>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060912]/90 to-transparent" />

      {/* Corner labels */}
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
