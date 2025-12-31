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
import ActivityCharts from "@/components/activity/ActivityCharts";
import StatPanel from "@/components/activity/StatPanel";
import { syncActivityStreams } from "@/app/actions/sync";
import MapWrapper from "@/components/activity/MapWrapper";
import AiThumbnail from "@/components/activity/AiThumbnail";
import { MarkAsRace } from "@/components/activity/MarkAsRace";

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
    columns: {
      activityId: true,
      userId: true,
      sportType: true,
      startDateTime: true,
      name: true,
      deviceName: true,
      distance: true,
      movingTimeInSeconds: true,
      elevation: true,
      averageSpeed: true,
      maxSpeed: true,
      averagePower: true,
      maxPower: true,
      weightedAveragePower: true,
      averageHeartRate: true,
      maxHeartRate: true,
      calories: true,
      sufferScore: true,
      kilojoules: true,
      elevHigh: true,
      elevLow: true,
      averageTemp: true,
      kudoCount: true,
      startingLatitude: true,
      startingLongitude: true,
      polyline: true,
      aiThumbnailUrl: true,
      aiThumbnailPrompt: true,
      aiVideoUrl: true,
      
      // Race fields
      isRace: true,
      raceName: true,
      raceDistanceClass: true,
      officialTime: true,
      placement: true,
      isPr: true,
      
      data: true, // Needed for segment efforts
    }
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
    // Non-blocking background generation
    // We don't await this so the page loads instantly. 
    // The UI handles the "Generating..." state via missing insight or we rely on SWR/refresh.
    generateCoachingInsight(activityId).catch(err => {
      console.error("Background generation trigger failed:", err);
    });
  }

  // Fetch stream data
  let stream = await db.query.activityStream.findFirst({
    where: eq(activityStream.activityId, activityId),
  });

  // Auto-sync streams if missing (Non-blocking)
  if (!stream && activityData.userId === session.userId) {
     syncActivityStreams(activityId).catch(err => {
        console.error("Background stream sync trigger failed:", err);
     });
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
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-[#06b6d4] selection:text-black">
      {/* Precision Top Bar (Breadcrumbs / Search) */}
      <div className="px-6 py-2 border-b border-zinc-900 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#09090b]">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/activities" className="hover:text-white transition-colors">Dashboards</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Strava Activity Overview</span>
        </div>
        <div className="flex items-center gap-6">
            <MarkAsRace 
              activityId={activityData.activityId} 
              isRace={!!activityData.isRace} 
              initialData={{
                raceName: activityData.raceName,
                distanceClass: activityData.raceDistanceClass,
                officialTime: activityData.officialTime,
                placement: activityData.placement,
                isPr: activityData.isPr,
              }}
            />
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
      <div className="grid grid-cols-12 gap-4 lg:gap-1 min-h-[140px] h-auto lg:h-[140px]">
        {/* Main Cyan Banner Block */}
        <div className="col-span-12 lg:col-span-7 bg-[#06b6d4] rounded-sm overflow-hidden flex flex-col">
            {/* Title Bar */}
            <div className="px-6 py-3 border-b border-black/10 flex justify-between items-center">
                <h1 className="text-xl lg:text-3xl font-black text-black tracking-tighter uppercase break-words pr-2">{activityData.name}</h1>
                <div className="flex gap-4 shrink-0">
                    <div className="w-10 h-10 bg-black/10 rounded-sm flex items-center justify-center">
                        <Footprints className="w-6 h-6 text-black" />
                    </div>
                </div>
            </div>
            {/* Clustered Metrics In Banner */}
            <div className="flex-1 grid grid-cols-3 divide-x divide-black/10">
                <StatPanel label="Moving time" value={durationFormatted} variant="cyan" size="lg" />
                <StatPanel label="Distance" value={distance} unit={getDistanceUnit(unitPreference)} variant="cyan" size="lg" />
                <StatPanel label="Pace" value={pace} unit={`/${getDistanceUnit(unitPreference)}`} variant="cyan" size="lg" />
            </div>
        </div>

        {/* Achievement / Stats Clustered Area */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-1">
            <div className="bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{activityData.kudoCount || 0}</span>
                    <Trophy className="w-6 h-6 text-cyan-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">Achievements</span>
            </div>
            <div className="bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4">
                 <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Medals</span>
            </div>
            <div className="bg-zinc-900 rounded-sm p-4 relative overflow-hidden group min-h-[100px] lg:min-h-0">
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Device</span>
                    <span className="text-xs font-black text-white uppercase">{activityData.deviceName || "GPS WATCH"}</span>
                 </div>
                 <Dumbbell className="absolute -bottom-2 -right-2 w-12 h-12 text-zinc-800 opacity-20 group-hover:scale-110 transition-transform" />
            </div>
        </div>
      </div>

      {/* Row 2: Nested Sub-Metrics */}
      <div className="grid grid-cols-12 gap-1 min-h-[80px] h-auto lg:h-[80px]">
          <div className="col-span-12 lg:col-span-9 grid grid-cols-2 lg:grid-cols-6 gap-1">
                <StatPanel label="Elapsed" value={elapsedFormatted} size="sm" />
                
                <StatPanel 
                    label="Elevation" 
                    value={unitPreference === 'imperial' 
                        ? (activityData.elevation ? activityData.elevation * 3.28084 : 0).toFixed(0)
                        : activityData.elevation?.toFixed(0) || "0"} 
                    unit={unitPreference === 'imperial' ? 'ft' : 'm'} 
                    subValue={activityData.elevHigh && activityData.elevLow 
                        ? `${unitPreference === 'imperial' ? (activityData.elevLow * 3.28084).toFixed(0) : activityData.elevLow.toFixed(0)} - ${unitPreference === 'imperial' ? (activityData.elevHigh * 3.28084).toFixed(0) : activityData.elevHigh.toFixed(0)}`
                        : undefined}
                    size="sm" 
                />
                
                <StatPanel label="Heart Rate" value={activityData.averageHeartRate || "—"} unit="bpm" variant="zinc" size="sm" />
                
                {activityData.averagePower ? (
                    <StatPanel 
                        label="Power" 
                        value={activityData.averagePower} 
                        unit="w" 
                        subValue={activityData.weightedAveragePower ? `NP ${activityData.weightedAveragePower}w` : undefined}
                        size="sm" 
                    />
                ) : (
                    <StatPanel label="Calories" value={activityData.calories || "—"} size="sm" />
                )}

                {/* New Metrics Conditional Render */}
                {activityData.kilojoules ? (
                    <StatPanel label="Work" value={activityData.kilojoules.toFixed(0)} unit="kJ" size="sm" />
                ) : (
                     <StatPanel label={activityData.averagePower ? "Calories" : "Temp"} value={activityData.averagePower ? (activityData.calories || "—") : (activityData.averageTemp ? `${activityData.averageTemp}°` : "—")} size="sm" />
                )}

                <StatPanel label="Suffer Score" value={activityData.sufferScore || "—"} variant={activityData.sufferScore && activityData.sufferScore > 100 ? "red" : "zinc"} size="sm" />
          </div>
          <div className="col-span-12 lg:col-span-3 bg-zinc-900/50 border border-zinc-900 rounded-sm flex items-center justify-between px-6 py-4 lg:py-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Date</span>
                <span className="text-xs font-black text-zinc-400">{new Date(activityData.startDateTime || "").toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                })}</span>
          </div>
      </div>

      {/* Row 3: Main Data Area (Charts Left, Map Right) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Stacked Charts - Expand to full width if no map data */}
        <div className={`col-span-12 ${
          (activityData.startingLatitude && activityData.startingLongitude) || activityData.polyline 
            ? "lg:col-span-7" 
            : "lg:col-span-12"
        }`}>
            <ActivityCharts stream={stream} unit={unitPreference} />
        </div>

        {/* Right: Integrated Map and AI Panel - ONLY SHOW IF LOCATION DATA EXISTS */}
        {((activityData.startingLatitude && activityData.startingLongitude) || activityData.polyline) && (
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                {/* AI Immersive View */}
                    <div className="h-[400px]">
                        <AiThumbnail 
                            activityId={activityId} 
                            thumbnailUrl={activityData.aiThumbnailUrl} 
                            thumbnailPrompt={activityData.aiThumbnailPrompt}
                            videoUrl={activityData.aiVideoUrl || null}
                            // Enhanced props for dynamic player
                            activityName={activityData.name || undefined}
                            polyline={activityData.polyline}
                            stats={{
                                distance: distance + (unitPreference === 'imperial' ? ' mi' : ' km'),
                                movingTime: durationFormatted,
                                elevation: (unitPreference === 'imperial' 
                                    ? (activityData.elevation ? activityData.elevation * 3.28084 : 0).toFixed(0) + " ft"
                                    : (activityData.elevation?.toFixed(0) || "0") + " m")
                            }}
                        />
                    </div>

                <div className="h-[600px] relative">
                    <div className="absolute inset-0 bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden">
                        <MapWrapper
                        latlng={stream?.latlng as [number, number][]} 
                        summaryPolyline={activityData.polyline}
                        />
                        
                        {/* Map Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[41]">
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
        )}
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
                            <tr key={effort.id} className="hover:bg-[#06b6d4]/5 transition-colors group">
                                <td className="px-6 py-3 font-bold text-zinc-200 border-r border-zinc-900 group-hover:text-[#06b6d4]">
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
