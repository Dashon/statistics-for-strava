"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

if (typeof window !== 'undefined') {
  L.Marker.prototype.options.icon = DefaultIcon;
}

interface ActivityPoint {
    id: string;
    lat: number;
    lng: number;
    name: string;
}

interface ActivityMapProps {
  activities: ActivityPoint[];
}

export default function ActivityMap({ activities }: ActivityMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-full h-[300px] bg-zinc-900 animate-pulse rounded-lg" />;

  const center: [number, number] = activities.length > 0 
    ? [activities[0].lat, activities[0].lng] 
    : [0, 0];

  return (
    <div className="w-full h-[400px] bg-zinc-900/50 rounded-lg overflow-hidden relative border border-zinc-800">
        <div className="absolute top-4 left-4 z-[1000] bg-zinc-900/80 p-2 rounded text-xs font-bold uppercase tracking-wider text-white border border-zinc-700">
            Activities on map
        </div>
      <MapContainer 
        center={center} 
        zoom={2} 
        style={{ height: "100%", width: "100%", background: "#18181b" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {activities.map((activity) => (
          <Marker key={activity.id} position={[activity.lat, activity.lng]}>
            <Popup>
              <div className="text-zinc-900 font-bold">{activity.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
