"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "polyline";
import L from "leaflet";

function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(bounds) && bounds.length > 0) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  return null;
}

export default function Heatmap({ polylines }: { polylines: string[] }) {
  const routes = polylines.map((p) => polyline.decode(p));
  
  const allCoords = routes.flat();
  const bounds: L.LatLngBoundsExpression = allCoords.length > 0 
    ? [
        [Math.min(...allCoords.map(c => c[0])), Math.min(...allCoords.map(c => c[1]))],
        [Math.max(...allCoords.map(c => c[0])), Math.max(...allCoords.map(c => c[1]))]
      ]
    : [[0, 0], [0, 0]];

  return (
    <div className="h-[calc(100vh-12rem)] w-full rounded-[2.5rem] overflow-hidden border border-zinc-900 group relative">
      <MapContainer 
        className="h-full w-full bg-zinc-950"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {routes.map((route, i) => (
          <Polyline 
            key={i} 
            positions={route as any} 
            pathOptions={{ color: '#06b6d4', weight: 1.5, opacity: 0.3 }} 
          />
        ))}
        {allCoords.length > 0 && <ChangeView bounds={bounds} />}
      </MapContainer>
      
      <div className="absolute bottom-6 left-6 z-[60]] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-6 py-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-white font-bold text-sm tracking-widest uppercase">{polylines.length} ACTIVITIES MAPPED</span>
          </div>
      </div>
    </div>
  );
}
