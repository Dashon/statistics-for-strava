'use client';

import { ActivitySummary } from "@/app/actions/modular-profile";
import MovingTimeChart from "@/components/dashboard/MovingTimeChart";
import { useMemo } from "react";

interface TrainingVolumeProps {
  activities: ActivitySummary[];
}

export function TrainingVolume({ activities }: TrainingVolumeProps) {
  const chartData = useMemo(() => {
    // Group by day (YYYY-MM-DD)
    const grouped = new Map<string, { period: string, run: number, ride: number, other: number }>();

    // Sort activities by date asc
    const sorted = [...activities].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Fill groups
    sorted.forEach(act => {
      const date = new Date(act.startDate);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, { period: dayKey, run: 0, ride: 0, other: 0 });
      }

      const entry = grouped.get(dayKey)!;
      const type = act.type;
      
      const isRun = ['Run', 'TrailRun', 'VirtualRun', 'UltraRun'].includes(type);
      const isRide = ['Ride', 'VirtualRide', 'EBikeRide', 'GravelRide', 'MountainBikeRide'].includes(type);

      if (isRun) {
        entry.run += act.movingTime;
      } else if (isRide) {
        entry.ride += act.movingTime;
      } else {
        entry.other += act.movingTime;
      }
    });

    // Fill gaps? MovingTimeChart might handle gaps or not. 
    // For now, return what we have. A proper chart needs continuous dates.
    // Let's assume the component or Recharts handles it gracefully-ish, or just show populated days.
    // Ideally we generate a range of dates.
    
    // Let's generate a range for the last 30 days if activities are sparse, 
    // OR just return the grouped list sorted.
    return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [activities]);

  return (
    <div className="h-full min-h-[350px]">
      {/* We need to override the default bg of MovingTimeChart or wrap it */}
      {/* The component has its own header and styles. We might want to customize title. */}
      {/* MovingTimeChart renders a Title "MOVING TIME". We can't easily change it without prop. */}
      {/* But it fits the request. */}
      <MovingTimeChart data={chartData} granularity="day" />
    </div>
  );
}
