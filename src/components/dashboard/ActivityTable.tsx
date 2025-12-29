"use client";

import { cn } from "@/lib/utils";
import { Zap, Footprints, Bike, Trophy, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

interface Activity {
  id: string;
  startDate: string;
  name: string;
  type: string;
  distance: number;
  movingTime: number;
  heartRate?: number;
  elevation: number;
  kilojoules?: number;
  achievementCount?: number;
  kudosCount?: number;
}

interface ActivityTableProps {
  activities: Activity[];
  distanceUnit: string;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  showPagination?: boolean;
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

function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

type SortField = 'startDateTime' | 'distance' | 'movingTime' | 'heartRate' | 'elevation';

export default function ActivityTable({ activities, distanceUnit, pagination, showPagination = false }: ActivityTableProps) {
  const router = useRouter();

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    sortBy: parseAsString,
    sortOrder: parseAsString,
  });

  const handleRowClick = (activityId: string) => {
    router.push(`/dashboard/activities/${activityId}`);
  };

  const handleSort = (field: SortField) => {
    const newSortOrder = params.sortBy === field && params.sortOrder === 'desc' ? 'asc' : 'desc';
    setParams({ sortBy: field, sortOrder: newSortOrder, page: 1 });
  };

  const getSortIcon = (field: SortField) => {
    if (params.sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return params.sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  };

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-x-auto bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <th
                className="px-4 py-3 cursor-pointer hover:bg-zinc-800/30 select-none"
                onClick={() => handleSort('startDateTime')}
              >
                <div className="flex items-center gap-2">
                  Date
                  {getSortIcon('startDateTime')}
                </div>
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:bg-zinc-800/30 select-none"
                onClick={() => handleSort('distance')}
              >
                <div className="flex items-center gap-2 justify-end">
                  Distance
                  {getSortIcon('distance')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:bg-zinc-800/30 select-none"
                onClick={() => handleSort('movingTime')}
              >
                <div className="flex items-center gap-2 justify-end">
                  Moving Time
                  {getSortIcon('movingTime')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer hover:bg-zinc-800/30 select-none"
                onClick={() => handleSort('heartRate')}
              >
                <div className="flex items-center gap-2 justify-center">
                  HR
                  {getSortIcon('heartRate')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:bg-zinc-800/30 select-none"
                onClick={() => handleSort('elevation')}
              >
                <div className="flex items-center gap-2 justify-end">
                  Elev.
                  {getSortIcon('elevation')}
                </div>
              </th>
              <th className="px-4 py-3 text-center"><Trophy className="w-3 h-3 inline" /></th>
              <th className="px-4 py-3 text-center font-bold">KJ</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {activities.map((activity) => (
              <tr
                key={activity.id}
                onClick={() => handleRowClick(activity.id)}
                className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
              >
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
                  {formatMovingTime(activity.movingTime)}
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

      {showPagination && pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
          <div className="text-sm text-zinc-400">
            Showing <span className="font-medium text-zinc-200">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium text-zinc-200">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{' '}
            of <span className="font-medium text-zinc-200">{pagination.totalCount}</span> activities
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPreviousPage}
              className={cn(
                "p-2 rounded border border-zinc-700 transition-colors",
                pagination.hasPreviousPage
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  : "opacity-50 cursor-not-allowed text-zinc-600"
              )}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className={cn(
                "p-2 rounded border border-zinc-700 transition-colors",
                pagination.hasPreviousPage
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  : "opacity-50 cursor-not-allowed text-zinc-600"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "px-3 py-1 rounded border text-sm transition-colors",
                      pageNum === pagination.page
                        ? "bg-orange-600 border-orange-600 text-white font-bold"
                        : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={cn(
                "p-2 rounded border border-zinc-700 transition-colors",
                pagination.hasNextPage
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  : "opacity-50 cursor-not-allowed text-zinc-600"
              )}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className={cn(
                "p-2 rounded border border-zinc-700 transition-colors",
                pagination.hasNextPage
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  : "opacity-50 cursor-not-allowed text-zinc-600"
              )}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
