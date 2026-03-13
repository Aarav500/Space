"use client";

import dynamic from "next/dynamic";

// Leaflet must be loaded client-side only (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

interface SatellitePosition {
  id: string;
  name: string;
  norad_id: number;
  lat: number;
  lng: number;
  risk_level: string;
}

interface SatelliteMapProps {
  satellites: SatellitePosition[];
}

const riskColors: Record<string, string> = {
  nominal: "#10b981",
  elevated: "#f59e0b",
  warning: "#f97316",
  critical: "#ef4444",
};

export default function SatelliteMap({ satellites }: SatelliteMapProps) {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-white/10">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        style={{ background: "#0a0f1a" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
        />
        {satellites.map((sat) => (
          <CircleMarker
            key={sat.id}
            center={[sat.lat, sat.lng]}
            radius={6}
            pathOptions={{
              color: riskColors[sat.risk_level] || "#6366f1",
              fillColor: riskColors[sat.risk_level] || "#6366f1",
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{sat.name}</p>
                <p className="text-gray-400">NORAD {sat.norad_id}</p>
                <p className="mt-1">Risk: <strong>{sat.risk_level}</strong></p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0a0f1a]/60 via-transparent to-transparent" />
    </div>
  );
}
