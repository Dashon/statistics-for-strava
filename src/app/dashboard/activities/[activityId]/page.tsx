import { auth } from "@/auth";
import { db } from "@/db";
import { activity, coachingInsights, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { Zap, MapPin, Trophy, Heart, TrendingUp, Clock, Activity, Footprints, Flame, Timer, Mountain, Dumbbell, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { generateCoachingInsight, getCoachingInsight } from "@/app/actions/coaching";
import { getAthleteProfile } from "@/app/actions/profile";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";
import { activityStream } from "@/db/schema";
import ActivityCharts from "./ActivityCharts";
import StatPanel from "./StatPanel";
import { syncActivityStreams } from "@/app/actions/sync";
import MapWrapper from "./MapWrapper";

export const metadata: Metadata = {
  title: "Activity Detail | QT Statistics for Strava",
  description: "Detailed activity analysis with AI coaching insights.",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const session = await auth() as any;
  if (!session?.userId) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  const { activityId } = await params;

  // SECURITY FIX: Fetch activity and verify it belongs to the user
  const activityData = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
  });

  if (!activityData) {
    notFound();
  }

  // SECURITY CHECK: Ensure this activity belongs to the current user
  if (activityData.userId !== session.userId) {
    notFound(); // Return 404 if trying to access another user's activity
  }

  // Fetch or generate coaching insight
  let insight = await getCoachingInsight(activityId);
  if (!insight && activityData.sportType === "Run") {
    // Auto-generate if doesn't exist
    try {
      await generateCoachingInsight(activityId);
      insight = await getCoachingInsight(activityId);
    } catch (error) {
      console.error("Failed to generate coaching insight:", error);
    }
  }

  // Fetch stream data
  let stream = await db.query.activityStream.findFirst({
    where: eq(activityStream.activityId, activityId),
  });

  // Auto-sync streams if missing
  if (!stream && activityData.userId === session.userId) {
    try {
      await syncActivityStreams(activityId);
      stream = await db.query.activityStream.findFirst({
        where: eq(activityStream.activityId, activityId),
      });
    } catch (error) {
      console.error("Failed to auto-sync streams:", error);
    }
  }

  // Fetch run letter if exists
  const letter = await db.query.runLetters.findFirst({
    where: eq(runLetters.activityId, activityId),
  });

  const distance = activityData.distance ? convertDistance(activityData.distance, unitPreference).toFixed(2) : "0.00";
  const durationFormatted = formatDuration(activityData.movingTimeInSeconds || 0);
  const elapsedFormatted = formatDuration(Number((activityData.data as any)?.elapsed_time || 0));
  
  const pace = activityData.distance && activityData.movingTimeInSeconds
    ? formatPace((activityData.movingTimeInSeconds / 60) / convertDistance(activityData.distance, unitPreference))
    : "0:00";

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-[#f97316] selection:text-black">
      {/* Precision Top Bar (Breadcrumbs / Search) */}
      <div className="px-6 py-2 border-b border-zinc-900 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#09090b]">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/activities" className="hover:text-white transition-colors">Dashboards</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Strava Activity Overview</span>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin duration-[3000ms]" />
                <span>{new Date(activityData.startDateTime || "").toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                <Clock className="w-3 h-3" />
                <span>LAST SYNC: {new Date().toLocaleString()}</span>
            </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* 1:1 Replica Header Section */}
      <div className="grid grid-cols-12 gap-1 h-[140px]">
        {/* Main Orange Banner Block */}
        <div className="col-span-12 lg:col-span-7 bg-[#f97316] rounded-sm overflow-hidden flex flex-col">
            {/* Title Bar */}
            <div className="px-6 py-3 border-b border-black/10 flex justify-between items-center">
                <h1 className="text-3xl font-black text-black tracking-tighter uppercase">{activityData.name}</h1>
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-black/10 rounded-sm flex items-center justify-center">
                        <Footprints className="w-6 h-6 text-black" />
                    </div>
                </div>
            </div>
            {/* Clustered Metrics In Banner */}
            <div className="flex-1 grid grid-cols-3 divide-x divide-black/10">
                <StatPanel label="Moving time" value={durationFormatted} variant="orange" size="lg" />
                <StatPanel label="Distance" value={distance} unit={getDistanceUnit(unitPreference)} variant="orange" size="lg" />
                <StatPanel label="Pace" value={pace} unit={`/${getDistanceUnit(unitPreference)}`} variant="orange" size="lg" />
            </div>
        </div>

        {/* Achievement / Stats Clustered Area */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-1">
            <div className="bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{activityData.kudoCount || 0}</span>
                    <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Achievements</span>
            </div>
            <div className="bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4">
                 <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Medals</span>
            </div>
            <div className="bg-zinc-900 rounded-sm p-4 relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Device</span>
                    <span className="text-xs font-black text-white uppercase">{activityData.deviceName || "GPS WATCH"}</span>
                 </div>
                 <Dumbbell className="absolute -bottom-2 -right-2 w-12 h-12 text-zinc-800 opacity-20 group-hover:scale-110 transition-transform" />
            </div>
        </div>
      </div>

      {/* Row 2: Nested Sub-Metrics */}
      <div className="grid grid-cols-12 gap-1 h-[80px]">
          <div className="col-span-12 lg:col-span-7 grid grid-cols-4 gap-1">
                <StatPanel label="Elapsed time" value={elapsedFormatted} size="sm" />
                <StatPanel label="Elevation" value={unitPreference === 'imperial' 
                        ? (activityData.elevation ? activityData.elevation * 3.28084 : 0).toFixed(1)
                        : activityData.elevation?.toFixed(1) || "0"} unit={unitPreference === 'imperial' ? 'ft' : 'm'} size="sm" />
                <StatPanel label="Heart Rate" value={activityData.averageHeartRate || "—"} variant="zinc" size="sm" />
                <StatPanel label="Calories" value={activityData.calories || "—"} size="sm" />
          </div>
          <div className="col-span-12 lg:col-span-5 bg-zinc-900/50 border border-zinc-900 rounded-sm flex items-center justify-between px-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Activity Date</span>
                <span className="text-xs font-black text-zinc-400">{new Date(activityData.startDateTime || "").toLocaleString()}</span>
          </div>
      </div>

      {/* Row 3: Main Data Area (Charts Left, Map Right) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Stacked Charts */}
        <div className="col-span-12 lg:col-span-7">
            <ActivityCharts stream={stream} unit={unitPreference} />
        </div>

        {/* Right: Integrated Map Panel */}
        <div className="col-span-12 lg:col-span-5 h-full min-h-[600px] relative">
            <div className="absolute inset-0 bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden">
                <MapWrapper
                  latlng={stream?.latlng as [number, number][]} 
                  summaryPolyline={activityData.polyline}
                />
                
                {/* Map Overlay Controls - Grafana Style */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                    <button className="w-8 h-8 bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black transition-colors">
                        <Zap className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button className="w-8 h-8 bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black transition-colors">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* AI Coaching & Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
            {insight && (
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/5 border border-purple-500/20 rounded-lg p-8 shadow-2xl shadow-purple-500/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            AI Coach Analysis
                        </h2>
                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest">
                            Powered by Claude Sonnet 4.5
                        </p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {insight.editedText || insight.insightText}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="lg:col-span-4">
            {letter && (
                <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-8 h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-zinc-400" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">
                            Run Letter
                        </h2>
                    </div>
                    <div className="text-zinc-500 leading-relaxed italic font-serif text-lg">
                        "{letter.editedText || letter.letterText}"
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Segments Table - Grafana 1:1 Precision */}
      {(activityData.data as any)?.segment_efforts && (activityData.data as any).segment_efforts.length > 0 && (
        <div className="bg-[#09090b] border border-zinc-900 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Segments
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-black/40 text-zinc-600 font-bold uppercase tracking-widest">
                            <th className="px-6 py-3 border-r border-zinc-900">Name</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Achievements</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Time</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Pace</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Heart Rate</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Power</th>
                            <th className="px-6 py-3 border-r border-zinc-900">Distance</th>
                            <th className="px-6 py-3 border-r border-zinc-900 text-right">PR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                        {(activityData.data as any).segment_efforts.map((effort: any) => {
                             const effortPace = effort.distance && effort.moving_time
                                ? formatPace((effort.moving_time / 60) / convertDistance(effort.distance, unitPreference))
                                : "0:00";
                             return (
                            <tr key={effort.id} className="hover:bg-[#f97316]/5 transition-colors group">
                                <td className="px-6 py-3 font-bold text-zinc-200 border-r border-zinc-900 group-hover:text-[#f97316]">
                                    {effort.name}
                                </td>
                                <td className="px-6 py-3 border-r border-zinc-900">
                                    {effort.pr_rank === 1 && <Trophy className="w-3 h-3 text-yellow-500" />}
                                </td>
                                <td className="px-6 py-3 font-mono text-zinc-400 border-r border-zinc-900">
                                    {formatDuration(effort.moving_time)}
                                </td>
                                <td className="px-6 py-3 font-mono text-zinc-400 border-r border-zinc-900">
                                    {effortPace}
                                </td>
                                <td className="px-6 py-3 font-mono text-zinc-400 border-r border-zinc-900">
                                    {effort.average_heartrate?.toFixed(0) || "—"} bpm
                                </td>
                                <td className="px-6 py-3 font-mono text-zinc-400 border-r border-zinc-900">
                                    {effort.average_watts?.toFixed(0) || "—"} w
                                </td>
                                <td className="px-6 py-3 font-mono text-zinc-400 border-r border-zinc-900">
                                    {convertDistance(effort.distance, unitPreference).toFixed(2)} {getDistanceUnit(unitPreference)}
                                </td>
                                <td className="px-6 py-3 text-right text-zinc-500 font-bold uppercase tracking-widest text-[9px]">
                                    {effort.pr_rank === 1 ? "Personal Record" : effort.pr_rank ? `#${effort.pr_rank}` : "—"}
                                </td>
                            </tr>
                        );})}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  </div>
);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(minPerMile: number): string {
  const minutes = Math.floor(minPerMile);
  const seconds = Math.floor((minPerMile % 1) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
