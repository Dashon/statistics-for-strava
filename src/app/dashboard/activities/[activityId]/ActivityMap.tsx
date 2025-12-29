"use client";

import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import polyline from "polyline";

interface ActivityMapProps {
  latlng?: [number, number][];
  summaryPolyline?: string | null;
}

// Component to handle map centering and bounds
function MapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);

  return null;
}

export default function ActivityMap({ latlng, summaryPolyline }: ActivityMapProps) {
  let positions: [number, number][] = [];

  if (latlng && latlng.length > 0) {
    positions = latlng;
  } else if (summaryPolyline) {
    positions = polyline.decode(summaryPolyline) as [number, number][];
  }

  const defaultCenter: [number, number] = positions.length > 0 ? positions[0] : [0, 0];

  return (
    <div className="w-100 h-100 grayscale hover:grayscale-0 transition-all duration-700">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#09090b" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {positions.length > 0 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: "#f97316",
                weight: 4,
                opacity: 0.8,
                lineJoin: "round",
              }}
            />
            <MapBounds positions={positions} />
          </>
        )}
      </MapContainer>
      
      {/* Overlay to match Grafana look */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-[2rem]"></div>
    </div>
  );
}
