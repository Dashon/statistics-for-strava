
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet icons in SSR/Remotion environment
let icon: L.Icon | undefined;
if (typeof window !== 'undefined') {
  icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

interface ActivityStats {
    distance: string;
    time: string;
    elevation: string;
}

export interface RouteVideoProps {
    coordinates: [number, number][]; // [lat, lng] pairs
    activityName: string;
    stats: ActivityStats;
    backgroundImage?: string;
}

export const RouteVideo: React.FC<RouteVideoProps> = ({ coordinates, activityName, stats, backgroundImage }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Ensure we have coordinates
    if (!coordinates || coordinates.length === 0) {
        return (
            <AbsoluteFill className="bg-zinc-900 flex items-center justify-center">
                <h1 className="text-white text-4xl">No GPS Data Available</h1>
            </AbsoluteFill>
        );
    }

    // Calculate map bounds
    const bounds = useMemo(() => {
        if (coordinates.length === 0) return undefined;
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        coordinates.forEach(([lat, lng]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });
        return [[minLat, minLng], [maxLat, maxLng]] as L.LatLngBoundsExpression;
    }, [coordinates]);

    // Animate the path drawing
    const pathProgress = spring({
        frame: frame - 20, // Start animation after 20 frames
        fps,
        config: { damping: 200 }
    });
    
    // Slice coordinates based on progress for drawing effect
    const visiblePoints = Math.max(2, Math.floor(coordinates.length * pathProgress));
    const currentPath = coordinates.slice(0, visiblePoints);
    const currentHead = currentPath[currentPath.length - 1];

    // Simple opacity fade in for stats
    const statsOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
    
    return (
        <AbsoluteFill className="bg-zinc-950 text-white font-sans">
            {/* Background Image (Cinematic) */}
            {backgroundImage && (
                <AbsoluteFill>
                    <Img src={backgroundImage} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/40" />
                </AbsoluteFill>
            )}

            {/* Map Background (Overlay) */}
            <div className={`absolute inset-0 z-0 ${backgroundImage ? 'opacity-50' : 'opacity-100'}`}>
                {/* 
                   NOTE: React-Leaflet requires window/document defined.
                   In Remotion server-rendering, we might need a workaround or ensure
                   we are using a browser-based renderer (Remotion Player/Bundle).
                */}
                {typeof window !== 'undefined' && (
                    <MapContainer
                        bounds={bounds}
                        zoomControl={false}
                        attributionControl={false}
                        style={{ width: '100%', height: '100%', background: 'transparent' }}
                    >
                        {!backgroundImage && (
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        )}
                        <Polyline 
                            positions={currentPath} 
                            pathOptions={{ color: '#f97316', weight: 6, opacity: 0.9 }} 
                        />
                        {currentHead && icon && <Marker position={currentHead} icon={icon} />}
                    </MapContainer>
                )}
            </div>

            {/* Overlay Gradient */}
            <AbsoluteFill className="bg-gradient-to-t from-black/90 via-transparent to-black/60 z-10 pointer-events-none" />

            {/* Header / Title */}
            <AbsoluteFill className="flex flex-col items-center pt-24 z-20 pointer-events-none">
                <div className="bg-orange-600 px-4 py-1 rounded-full mb-4 shadow-lg shadow-orange-900/40">
                    <span className="text-white font-bold tracking-widest uppercase text-lg">Strava Activity</span>
                </div>
                <h1 className="text-5xl font-black text-center max-w-2xl leading-tight drop-shadow-xl text-white">
                    {activityName}
                </h1>
            </AbsoluteFill>

            {/* Footer / Stats */}
            <AbsoluteFill className="flex flex-col justify-end items-center pb-24 z-20 pointer-events-none" style={{ opacity: statsOpacity }}>
                <div className="grid grid-cols-3 gap-8 w-full max-w-xl px-8">
                    <div className="flex flex-col items-center">
                        <span className="text-zinc-400 text-xl font-medium uppercase tracking-wider mb-1">Distance</span>
                        <span className="text-4xl font-bold font-mono">{stats.distance}</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-zinc-800 border-r">
                        <span className="text-zinc-400 text-xl font-medium uppercase tracking-wider mb-1">Time</span>
                        <span className="text-4xl font-bold font-mono">{stats.time}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-zinc-400 text-xl font-medium uppercase tracking-wider mb-1">Elevation</span>
                        <span className="text-4xl font-bold font-mono">{stats.elevation}</span>
                    </div>
                </div>
                
                <div className="mt-12 flex items-center gap-3 opacity-60">
                     <span className="text-lg font-medium">Generated by Statistics for Strava</span>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
