import { auth } from "@/auth";
import { db } from "@/db";
import { activity, coachingInsights, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { Zap, MapPin, Trophy, Heart, TrendingUp, Clock, Activity, Footprints, Flame, Timer, Mountain, Dumbbell } from "lucide-react";
import type { Metadata } from "next";
import { generateCoachingInsight, getCoachingInsight } from "@/app/actions/coaching";
import { getAthleteProfile } from "@/app/actions/profile";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";
import { activityStream } from "@/db/schema";
import ActivityCharts from "./ActivityCharts";
import StatPanel from "./StatPanel";
import { syncActivityStreams } from "@/app/actions/sync";
import dynamic from "next/dynamic";

const ActivityMap = dynamic(() => import("./ActivityMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse" />
}) as any;

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
    <div className="p-8 space-y-6 max-w-[1800px] mx-auto min-h-screen bg-black text-zinc-300">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tight">
                {activityData.name}
              </h1>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
                {new Date(activityData.startDateTime).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-zinc-900 text-zinc-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest">
            {activityData.sportType}
          </span>
          {activityData.deviceName && (
            <span className="bg-zinc-900 text-zinc-500 px-4 py-2 rounded-xl text-xs font-bold">
              {activityData.deviceName}
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics - Grafana Inspired Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
            {/* Top Bar Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatPanel 
                    label="Moving Time" 
                    value={durationFormatted} 
                    icon={Timer} 
                    variant="orange"
                    subValue={`Elapsed: ${elapsedFormatted}`}
                />
                <StatPanel 
                    label="Distance" 
                    value={distance} 
                    unit={getDistanceUnit(unitPreference)} 
                    icon={Activity}
                />
                <StatPanel 
                    label="Pace" 
                    value={pace} 
                    unit={`/${getDistanceUnit(unitPreference)}`} 
                    icon={Timer}
                />
                <StatPanel 
                    label="Avg Heart Rate" 
                    value={activityData.averageHeartRate || "—"} 
                    unit="bpm"
                    icon={Heart}
                    variant="red"
                />
            </div>

            {/* Middle Row Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <StatPanel 
                    label="Elevation" 
                    value={unitPreference === 'imperial' 
                        ? (activityData.elevation ? activityData.elevation * 3.28084 : 0).toFixed(0)
                        : activityData.elevation?.toFixed(0) || "0"} 
                    unit={unitPreference === 'imperial' ? 'ft' : 'm'}
                    icon={Mountain}
                />
                <StatPanel 
                    label="Calories" 
                    value={activityData.calories || "—"} 
                    icon={Flame}
                />
                <StatPanel 
                    label="Cadence" 
                    value={activityData.averageCadence || "—"} 
                    unit="rpm"
                    icon={Footprints}
                />
                <StatPanel 
                    label="Avg Power" 
                    value={activityData.averagePower || "—"} 
                    unit="w"
                    icon={Zap}
                />
            </div>

            {/* Charts Section */}
            <ActivityCharts stream={stream} unit={unitPreference} />
        </div>

        {/* Map & Meta Section */}
        <div className="xl:col-span-1 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden h-[500px] relative">
                <ActivityMap 
                  latlng={stream?.latlng as [number, number][]} 
                  summaryPolyline={activityData.polyline}
                />
            </div>
            
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Achievements & Kudos</span>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-3xl font-black text-white">{activityData.kudoCount || 0}</span>
                        <span className="text-xs text-zinc-600 font-bold ml-2 uppercase">Kudos</span>
                    </div>
                </div>
            </div>

            {activityData.deviceName && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Device</span>
                    <span className="text-white font-bold">{activityData.deviceName}</span>
                </div>
            )}
        </div>
      </div>

      {/* AI Coaching & Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insight && (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/5 border border-purple-500/20 rounded-[2rem] p-8 shadow-2xl shadow-purple-500/5">
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

                {insight.runClassification && (
                    <div className="bg-zinc-900/50 border border-purple-500/20 rounded-xl px-4 py-2 inline-block mb-6">
                    <span className="text-purple-400 font-black uppercase text-xs tracking-widest">
                        {insight.runClassification}
                    </span>
                    </div>
                )}

                <div className="prose prose-invert max-w-none">
                    <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {insight.editedText || insight.insightText}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800/50 text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex justify-between items-center">
                    <span>Generated {new Date(insight.generatedAt).toLocaleDateString()}</span>
                    <span className="italic">Insight ID: {activityId.slice(-6)}</span>
                </div>
            </div>
        )}

        {letter && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8">
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

      {/* Segments Table - Grafana Style */}
      {(activityData.data as any)?.segment_efforts && (activityData.data as any).segment_efforts.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-900 flex justify-between items-center">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Segments
                </h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                    {(activityData.data as any).segment_efforts.length} efforts detected
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900/50">
                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Time</th>
                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Distance</th>
                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Avg Heart Rate</th>
                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">PR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                        {(activityData.data as any).segment_efforts.map((effort: any) => (
                            <tr key={effort.id} className="hover:bg-zinc-900/30 transition-colors group">
                                <td className="px-8 py-4">
                                    <div className="text-white font-bold group-hover:text-orange-500 transition-colors cursor-default">
                                        {effort.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-0.5 font-mono">
                                        ID: {effort.id}
                                    </div>
                                </td>
                                <td className="px-8 py-4 font-mono text-white">
                                    {formatDuration(effort.moving_time)}
                                </td>
                                <td className="px-8 py-4 font-mono text-zinc-400">
                                    {convertDistance(effort.distance, unitPreference).toFixed(2)} {getDistanceUnit(unitPreference)}
                                </td>
                                <td className="px-8 py-4">
                                    {effort.average_heartrate ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="font-mono text-white">{effort.average_heartrate.toFixed(0)}</span>
                                        </div>
                                    ) : "—"}
                                </td>
                                <td className="px-8 py-4 text-right">
                                    {effort.pr_rank === 1 ? (
                                        <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Personal Record</span>
                                    ) : effort.pr_rank ? (
                                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">#{effort.pr_rank} overall</span>
                                    ) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
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
