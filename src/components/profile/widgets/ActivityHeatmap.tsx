'use client';

import { ActivitySummary } from "@/app/actions/modular-profile";
import { useMemo } from "react";
import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("@/components/dashboard/ActivityMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900/50 animate-pulse" />
});

interface ActivityHeatmapProps {
  activities: ActivitySummary[];
}

export function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  const mapPoints = useMemo(() => {
    return activities
      .filter(a => a.startLat && a.startLng)
      .map(a => ({
        id: a.activityId,
        lat: a.startLat!, // Filtered above
        lng: a.startLng!, 
        name: a.name
      }));
  }, [activities]);

  return (
    <div className="h-full min-h-[300px] rounded-xl overflow-hidden border border-zinc-800">
      <ActivityMap activities={mapPoints} />
    </div>
  );
}
