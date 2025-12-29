"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString, parseAsIsoDateTime } from "nuqs";
import { getTimeRangeFromParams } from "@/lib/url-params";
import ActivityTable from "./ActivityTable";
import TimeRangeSelector from "./TimeRangeSelector";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";

interface ActivitiesPageContentProps {
  unitPreference: MeasurementUnit;
}

const ACTIVITY_TYPES = ["All", "Run", "Ride", "Walk", "Swim", "Hike", "WeightTraining", "Yoga"];

export default function ActivitiesPageContent({ unitPreference }: ActivitiesPageContentProps) {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    sortBy: parseAsString,
    sortOrder: parseAsString,
    from: parseAsIsoDateTime,
    to: parseAsIsoDateTime,
    range: parseAsString,
    activityType: parseAsString,
  });

  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const { from, to } = useMemo(() => 
    getTimeRangeFromParams(params.range as any, params.from, params.to),
    [params.range, params.from, params.to]
  );

  // Build query params
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    from: from.toISOString(),
    to: to.toISOString(),
  });

  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params.activityType && params.activityType !== "All") {
    queryParams.append("activityType", params.activityType);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["activities-page", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/activities?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activities = data?.activities || [];
  const pagination = data?.pagination;

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

  const handleTypeFilter = (type: string) => {
    setParams({ activityType: type === "All" ? null : type, page: 1 });
    setShowFilters(false);
  };

  const activeFilters = [
    params.activityType && params.activityType !== "All" ? `Type: ${params.activityType}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
            ACTIVITIES
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">
            Chronicle of Effort
            {pagination && (
              <span className="ml-2">
                ({pagination.totalCount} total)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Activity Type Filter */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                params.activityType && params.activityType !== "All"
                  ? "bg-orange-600 border-orange-600 text-white"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {params.activityType && params.activityType !== "All" ? params.activityType : "Filter"}
              </span>
              {activeFilters.length > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Activity Type
                  </div>
                  {ACTIVITY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleTypeFilter(type)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                        params.activityType === type || (!params.activityType && type === "All")
                          ? "bg-orange-600 text-white"
                          : "text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TimeRangeSelector />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Active filters:</span>
          {activeFilters.map((filter, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-orange-600/20 border border-orange-600/50 rounded-full text-xs text-orange-400 font-medium"
            >
              {filter}
            </span>
          ))}
          <button
            onClick={() => setParams({ activityType: null, page: 1 })}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading activities...</div>
        </div>
      )}

      {/* Activities Table */}
      {!isLoading && (
        <ActivityTable
          activities={tableActivities}
          distanceUnit={getDistanceUnit(unitPreference)}
          pagination={pagination}
          showPagination={true}
        />
      )}

      {/* Empty State */}
      {!isLoading && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-zinc-500 text-lg">No activities found</div>
          <p className="text-zinc-600 text-sm">Try adjusting your filters or time range</p>
        </div>
      )}
    </div>
  );
}
