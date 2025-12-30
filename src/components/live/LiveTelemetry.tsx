'use client';

import { useEffect, useState } from 'react';

interface TelemetryData {
  distance: number; // meters
  pace: number; // seconds per km
  elapsedTime: number; // seconds
  heartRate: number | null;
  elevation: number | null;
  cadence: number | null;
}

interface LiveTelemetryProps {
  activityId?: string | null;
  // For demo/manual data
  initialData?: Partial<TelemetryData>;
  // Refresh interval in ms (0 = no refresh)
  refreshInterval?: number;
}

function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm === Infinity) return '--:--';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function StatCard({
  label,
  value,
  unit,
  color = 'orange',
  pulse = false,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: 'orange' | 'red' | 'green' | 'blue';
  pulse?: boolean;
}) {
  const colorClasses = {
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-pink-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
  };

  return (
    <div className="relative bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 overflow-hidden">
      {/* Glow effect */}
      <div
        className={`absolute inset-0 opacity-10 bg-gradient-to-br ${colorClasses[color]}`}
      />
      
      {/* Content */}
      <div className="relative">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent ${
              pulse ? 'animate-pulse' : ''
            }`}
          >
            {value}
          </span>
          {unit && <span className="text-sm text-zinc-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export function LiveTelemetry({
  activityId,
  initialData,
  refreshInterval = 0,
}: LiveTelemetryProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    distance: initialData?.distance ?? 0,
    pace: initialData?.pace ?? 0,
    elapsedTime: initialData?.elapsedTime ?? 0,
    heartRate: initialData?.heartRate ?? null,
    elevation: initialData?.elevation ?? null,
    cadence: initialData?.cadence ?? null,
  });
  const [isLoading, setIsLoading] = useState(!!activityId);

  // Fetch activity data if activityId is provided
  useEffect(() => {
    if (!activityId) return;

    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activities/${activityId}`);
        if (res.ok) {
          const data = await res.json();
          setTelemetry({
            distance: data.distance || 0,
            pace: data.averageSpeed
              ? 1000 / data.averageSpeed // Convert m/s to s/km
              : 0,
            elapsedTime: data.movingTimeInSeconds || 0,
            heartRate: data.averageHeartRate || null,
            elevation: data.elevation || null,
            cadence: data.averageCadence || null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch activity data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();

    // Set up refresh interval if specified
    if (refreshInterval > 0) {
      const interval = setInterval(fetchActivity, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [activityId, refreshInterval]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 animate-pulse"
          >
            <div className="h-3 w-16 bg-zinc-800 rounded mb-2" />
            <div className="h-7 w-24 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Elapsed Time"
          value={formatTime(telemetry.elapsedTime)}
          color="orange"
        />
        <StatCard
          label="Distance"
          value={formatDistance(telemetry.distance)}
          color="blue"
        />
        <StatCard
          label="Pace"
          value={formatPace(telemetry.pace)}
          unit="/km"
          color="green"
        />
        {telemetry.heartRate && (
          <StatCard
            label="Heart Rate"
            value={telemetry.heartRate.toString()}
            unit="bpm"
            color="red"
            pulse
          />
        )}
        {telemetry.elevation !== null && (
          <StatCard
            label="Elevation"
            value={Math.round(telemetry.elevation).toString()}
            unit="m"
            color="blue"
          />
        )}
        {telemetry.cadence !== null && (
          <StatCard
            label="Cadence"
            value={telemetry.cadence.toString()}
            unit="spm"
            color="green"
          />
        )}
      </div>
    </div>
  );
}
