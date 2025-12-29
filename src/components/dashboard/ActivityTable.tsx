"use client";

import { cn } from "@/lib/utils";
import { Zap, Footprints, Bike, MapPin, Trophy } from "lucide-react";
import { format } from "date-fns";

interface Activity {
  id: string;
  startDate: string;
  name: string;
  type: string;
  distance: number;
  movingTime: string;
  heartRate?: number;
  elevation: number;
  kilojoules?: number;
  achievementCount?: number;
  kudosCount?: number;
}

interface ActivityTableProps {
  activities: Activity[];
  distanceUnit: string;
}

const getHRColor = (hr?: number) => {
  if (!hr) return "transparent";
  if (hr > 170) return "bg-red-600 text-white";
  if (hr > 155) return "bg-red-500 text-white";
  if (hr > 140) return "bg-red-400 text-white";
  if (hr > 125) return "bg-red-300 text-zinc-900";
  return "bg-red-200 text-zinc-900";
};

const getKJColor = (kj?: number) => {
  if (!kj) return "transparent";
  if (kj > 1000) return "bg-orange-600 text-white";
  if (kj > 750) return "bg-orange-500 text-white";
  if (kj > 500) return "bg-orange-400 text-white";
  if (kj > 250) return "bg-yellow-500 text-zinc-900";
  return "bg-yellow-400 text-zinc-900";
};

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'run': return <Footprints className="w-4 h-4" />;
    case 'ride': return <Bike className="w-4 h-4" />;
    default: return <Zap className="w-4 h-4" />;
  }
};

export default function ActivityTable({ activities, distanceUnit }: ActivityTableProps) {
  return (
    <div className="w-full overflow-x-auto bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-right">Distance</th>
            <th className="px-4 py-3 text-right">Moving Time</th>
            <th className="px-4 py-3 text-center">HR</th>
            <th className="px-4 py-3 text-right">Elev.</th>
            <th className="px-4 py-3 text-center"><Trophy className="w-3 h-3 inline" /></th>
            <th className="px-4 py-3 text-center font-bold">KJ</th>
            <th className="px-4 py-3">ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-zinc-800/30 transition-colors group">
              <td className="px-4 py-2 text-zinc-400 whitespace-nowrap">
                {format(new Date(activity.startDate), "yyyy-MM-dd HH:mm")}
              </td>
              <td className="px-4 py-2 font-medium text-zinc-200 truncate max-w-[200px]" title={activity.name}>
                {activity.name}
              </td>
              <td className="px-4 py-2 text-zinc-500">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  {activity.type}
                </div>
              </td>
              <td className="px-4 py-2 text-right text-zinc-300 font-mono">
                {activity.distance.toFixed(1)} {distanceUnit}
              </td>
              <td className="px-4 py-2 text-right text-zinc-300 font-mono">
                {activity.movingTime}
              </td>
              <td className={cn("px-4 py-2 text-center font-bold font-mono", getHRColor(activity.heartRate))}>
                {activity.heartRate || "-"}
              </td>
              <td className="px-4 py-2 text-right text-zinc-300 font-mono">
                {activity.elevation.toFixed(0)} ft
              </td>
              <td className="px-4 py-2 text-center text-zinc-500">
                {activity.achievementCount && activity.achievementCount > 0 ? activity.achievementCount : ""}
              </td>
              <td className={cn("px-4 py-2 text-center font-bold font-mono", getKJColor(activity.kilojoules))}>
                {activity.kilojoules ? `${activity.kilojoules.toFixed(0)} J` : "-"}
              </td>
              <td className="px-4 py-2 text-zinc-600 font-mono text-[10px]">
                {activity.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
