
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAthleteProfile } from "@/app/actions/profile";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";
import { startOfMonth, format, subMonths, isSameMonth } from "date-fns";
import SyncButton from "./SyncButton";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MovingTimeChart from "@/components/dashboard/MovingTimeChart";
import ActivityMap from "@/components/dashboard/ActivityMap";
import ActivityTable from "@/components/dashboard/ActivityTable";
import DistanceElevationChart from "@/components/dashboard/DistanceElevationChart";

export const metadata = {
  title: "Dashboard | QT Statistics for Strava",
  description: "View your activity statistics, recent workouts, and performance insights.",
};

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

export default async function DashboardPage() {
  const session = (await auth()) as any;
  if (!session?.userId) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  // Fetch all user activities for summary calculations
  const allActivities = await db.query.activity.findMany({
    where: eq(activity.userId, session.userId),
    orderBy: (activity, { desc }) => [desc(activity.startDateTime)],
  });

  if (allActivities.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-950 min-h-screen">
          <h1 className="text-2xl font-bold text-white mb-4">No activities found</h1>
          <SyncButton />
      </div>
    );
  }

  // Calculate monthly stats for the last 12 months
  const now = new Date();
  const monthlyStats = Array.from({ length: 12 }).map((_, i) => {
    const month = subMonths(now, 11 - i);
    const start = startOfMonth(month);
    
    const monthActivities = allActivities.filter(a => {
        const date = new Date(a.startDateTime);
        return isSameMonth(date, month);
    });

    const runTime = monthActivities.filter(a => a.sportType?.toLowerCase().includes('run')).reduce((acc, a) => acc + (a.movingTimeInSeconds || 0), 0);
    const rideTime = monthActivities.filter(a => a.sportType?.toLowerCase().includes('ride')).reduce((acc, a) => acc + (a.movingTimeInSeconds || 0), 0);
    const otherTime = monthActivities.filter(a => !a.sportType?.toLowerCase().includes('run') && !a.sportType?.toLowerCase().includes('ride')).reduce((acc, a) => acc + (a.movingTimeInSeconds || 0), 0);
    
    const distanceMeters = monthActivities.reduce((acc, a) => acc + (a.distance || 0), 0);
    const elevationFeet = monthActivities.reduce((acc, a) => acc + (a.elevation || 0), 0) * 3.28084; // Convert meters to feet for the target style

    return {
      monthStr: format(month, "yyyy-MM"),
      run: runTime,
      ride: rideTime,
      other: otherTime,
      distance: Number(convertDistance(distanceMeters, unitPreference).toFixed(1)),
      elevation: Math.round(elevationFeet),
    };
  });

  // Latest month summary (last full month or current month with data)
  const latestMonthData = monthlyStats[monthlyStats.length - 1]; // Current month
  const latestMonthActivities = allActivities.filter(a => isSameMonth(new Date(a.startDateTime), now));
  
  const totalDistance = latestMonthActivities.reduce((acc, a) => acc + (a.distance || 0), 0);
  const totalElevation = latestMonthActivities.reduce((acc, a) => acc + (a.elevation || 0), 0) * 3.28084;
  const totalTime = latestMonthActivities.reduce((acc, a) => acc + (a.movingTimeInSeconds || 0), 0);
  const kilojoules = latestMonthActivities.reduce((acc, a) => acc + (a.data?.kilojoules || 0), 0);

  const activitiesForMap = allActivities
    .filter(a => a.startingLatitude && a.startingLongitude)
    .slice(0, 50)
    .map(a => ({
        id: a.activityId,
        lat: a.startingLatitude!,
        lng: a.startingLongitude!,
        name: a.name || 'Activity'
    }));

  const activitiesForTable = allActivities.slice(0, 20).map(a => ({
    id: a.activityId,
    startDate: a.startDateTime,
    name: a.name || 'Untitled',
    type: a.sportType || 'Other',
    distance: convertDistance(a.distance || 0, unitPreference),
    movingTime: formatSeconds(a.movingTimeInSeconds || 0),
    heartRate: a.averageHeartRate || undefined,
    elevation: (a.elevation || 0) * 3.28084,
    kilojoules: a.data?.kilojoules || undefined,
    achievementCount: a.data?.achievement_count || 0,
  }));

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* Header with Sync */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-900">
        <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-sm">Dashboards &gt; Strava Athlete Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
            <SyncButton />
            <form action={async () => { "use server"; await signOut(); }}>
                <button className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest font-bold">Sign Out</button>
            </form>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-x divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="bg-orange-600 p-6 flex items-center justify-center col-span-1 md:col-span-1">
            <h1 className="text-5xl font-bold tracking-tighter leading-none text-center">Last month summary</h1>
          </div>
          <DashboardCard title="Activities" value={latestMonthActivities.length} className="bg-orange-600/95" />
          <DashboardCard 
            title="Distance" 
            value={Math.round(convertDistance(totalDistance, unitPreference))} 
            unit={getDistanceUnit(unitPreference)} 
            className="bg-orange-600/90" 
          />
          <DashboardCard title="Time" value={formatSeconds(totalTime)} className="bg-orange-600/85" />
          <DashboardCard title="Elevation gain" value={totalElevation.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit="ft" className="bg-orange-600/80" />
        </div>

        {/* Charts & Map Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MovingTimeChart 
              data={monthlyStats.map(s => ({
                month: s.monthStr,
                run: s.run,
                ride: s.ride,
                other: s.other
              }))} 
            />
          </div>
          <div className="lg:col-span-1">
            <ActivityMap activities={activitiesForMap} />
          </div>
        </div>

        {/* Table & Small Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/30 rounded-lg overflow-hidden border border-zinc-800">
                <div className="p-4 border-b border-zinc-800 font-bold uppercase tracking-widest text-xs text-zinc-500">Activities</div>
                <ActivityTable activities={activitiesForTable} distanceUnit={getDistanceUnit(unitPreference)} />
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4">
            <DistanceElevationChart 
                data={monthlyStats.map(s => ({
                    month: s.monthStr,
                    distance: s.distance,
                    elevation: s.elevation
                }))} 
            />
            {/* Legend for the map/other info if needed */}
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex-grow">
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mb-2">Legend</span>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Run</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-800"></div> Ride</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-600"></div> Other</div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
