"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsIsoDateTime, parseAsString } from "nuqs";
import { getTimeRangeFromParams } from "@/lib/url-params";
import MovingTimeChart from "./MovingTimeChart";
import { getGranularity } from "@/lib/date-utils";

import DistanceElevationChart from "./DistanceElevationChart";
import ActivityTable from "./ActivityTable";
import DashboardCard from "./DashboardCard";
import TimeRangeSelector from "./TimeRangeSelector";
import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("./ActivityMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[500px] bg-zinc-900/30 animate-pulse rounded-lg border border-zinc-800" />
});
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";
import { useMemo } from "react";

interface DashboardContentProps {
  unitPreference: MeasurementUnit;
  initialData?: any;
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

export default function DashboardContent({ unitPreference, initialData }: DashboardContentProps) {
  const [params] = useQueryStates({
    from: parseAsIsoDateTime,
    to: parseAsIsoDateTime,
    range: parseAsString,
  });

  const { from, to } = useMemo(() => 
    getTimeRangeFromParams(params.range as any, params.from, params.to),
    [params.range, params.from, params.to]
  );

  // Fetch stats data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["activity-stats", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const granularity = getGranularity(from, to);
      const res = await fetch(
        `/api/activities/stats?from=${from.toISOString()}&to=${to.toISOString()}&groupBy=${granularity}`
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent activities for table (top 20)
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities", from.toISOString(), to.toISOString(), 1, 20],
    queryFn: async () => {
      const res = await fetch(
        `/api/activities?from=${from.toISOString()}&to=${to.toISOString()}&page=1&limit=20&sortBy=startDateTime&sortOrder=desc`
      );
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch map activities (top 50 with coordinates)
  const { data: mapActivitiesData } = useQuery({
    queryKey: ["map-activities", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/activities?from=${from.toISOString()}&to=${to.toISOString()}&page=1&limit=50&sortBy=startDateTime&sortOrder=desc`
      );
      if (!res.ok) throw new Error("Failed to fetch map activities");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = statsLoading || activitiesLoading;

  const monthlyStats = statsData?.monthlyStats || [];
  const summary = statsData?.summary || {};
  const activities = activitiesData?.activities || [];
  const mapActivities =
    mapActivitiesData?.activities
      ?.filter((a: any) => a.startingLatitude && a.startingLongitude)
      .map((a: any) => ({
        id: a.id,
        lat: a.startingLatitude,
        lng: a.startingLongitude,
        name: a.name || "Activity",
      })) || [];

  // Transform activities for table
  const tableActivities = activities.map((a: any) => ({
    id: a.id,
    startDate: a.startDate,
    name: a.name || "Untitled",
    type: a.type || "Other",
    distance: convertDistance(a.distance || 0, unitPreference),
    movingTime: a.movingTime || 0,
    heartRate: a.heartRate,
    elevation: a.elevation || 0,
    kilojoules: a.kilojoules,
    achievementCount: a.achievementCount || 0,
  }));

  return (
    <div className="p-4 space-y-4">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-200">Activity Dashboard</h2>
        <TimeRangeSelector />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading dashboard data...</div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-orange-600 p-6 flex items-center justify-center col-span-2 md:col-span-1 lg:col-span-1">
              <h1 className="text-5xl font-bold tracking-tighter leading-none text-center">
                Summary
              </h1>
            </div>
            <DashboardCard
              title="Activities"
              value={summary.totalActivities || 0}
              className="bg-orange-600/95"
            />
            <DashboardCard
              title="Distance"
              value={Math.round(convertDistance(summary.totalDistance * 1000 || 0, unitPreference))}
              unit={getDistanceUnit(unitPreference)}
              className="bg-orange-600/90"
            />
            <DashboardCard
              title="Time"
              value={formatSeconds(summary.totalMovingTime || 0)}
              className="bg-orange-600/85"
            />
            <DashboardCard
              title="Elevation gain"
              value={(summary.totalElevation || 0).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              unit="ft"
              className="bg-orange-600/80"
            />
          </div>

          {/* Charts, Map, Table Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
            {/* Left Column: Moving Time Chart & Table */}
            <div className="lg:col-span-2 space-y-4">
                <MovingTimeChart
                  data={monthlyStats.map((s: any) => ({
                    period: s.month,
                    run: s.run,
                    ride: s.ride,
                    other: s.other,
                  }))}
                  granularity={statsData?.granularity}
                />
              <div className="bg-zinc-900/30 rounded-lg overflow-hidden border border-zinc-800">
                <div className="p-4 border-b border-zinc-800 font-bold uppercase tracking-widest text-xs text-zinc-500">
                  Recent Activities
                </div>
                <ActivityTable
                  activities={tableActivities}
                  distanceUnit={getDistanceUnit(unitPreference)}
                  showPagination={false}
                />
              </div>
            </div>

            {/* Right Column: Map & Small Chart */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="flex-grow min-h-[500px]">
                <ActivityMap activities={mapActivities} />
              </div>
              <DistanceElevationChart
                data={monthlyStats.map((s: any) => ({
                  month: s.month,
                  distance: s.distance,
                  elevation: s.elevation,
                }))}
              />
              {/* Legend */}
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mb-2">
                  Legend
                </span>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-600"></div> Run
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-900"></div> Ride
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-zinc-600"></div> Other
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
