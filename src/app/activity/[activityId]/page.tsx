import { db } from "@/db";
import { activity, coachingInsights, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Zap, MapPin, Trophy, Heart, TrendingUp, Clock, Activity, Footprints, Flame, Timer, Mountain, Dumbbell, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicActivityDetail } from "@/app/actions/public-activity";
import { convertDistance, getDistanceUnit } from "@/lib/units";
import ActivityCharts from "@/components/activity/ActivityCharts";
import StatPanel from "@/components/activity/StatPanel";
import MapWrapper from "@/components/activity/MapWrapper";
import AiThumbnail from "@/components/activity/AiThumbnail";

export async function generateMetadata({ params }: { params: Promise<{ activityId: string }> }): Promise<Metadata> {
  const { activityId } = await params;
  const data = await getPublicActivityDetail(activityId);
  
  if (!data) return { title: "Activity Not Found" };

  return {
    title: `${data.activity.name} | QT.run`,
    description: `Detailed analysis of ${data.user.displayName}'s activity.`,
  };
}

export default async function PublicActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const data = await getPublicActivityDetail(activityId);

  if (!data) {
    notFound();
  }

  const { activity: activityData, insight, stream, letter, user } = data;
  const unitPreference = 'metric'; // Default to metric for public for now, or could store in user profile

  const distance = activityData.distance ? convertDistance(activityData.distance, unitPreference).toFixed(2) : "0.00";
  const durationFormatted = formatDuration(activityData.movingTimeInSeconds || 0);
  const elapsedFormatted = formatDuration(Number((activityData.data as any)?.elapsed_time || 0));
  
  const pace = activityData.distance && activityData.movingTimeInSeconds
    ? formatPace((activityData.movingTimeInSeconds / 60) / convertDistance(activityData.distance, unitPreference))
    : "0:00";

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-[#06b6d4] selection:text-black">
      {/* Precision Top Bar (Public Version) */}
      <div className="px-6 py-2 border-b border-zinc-900 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#09090b]">
        <div className="flex items-center gap-4">
            <Link href={`/athlete/${user.username}`} className="hover:text-white transition-colors">{user.displayName}'s Profile</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Activity Overview</span>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{new Date(activityData.startDateTime || "").toLocaleString()}</span>
            </div>
            {/* Attribution */}
            <div className="border-l border-zinc-800 pl-4">
                <span className="text-zinc-600">VIEWING VIA </span>
                <span className="text-cyan-500 font-black">QT.RUN</span>
            </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-[1920px] mx-auto pb-20">
        {/* 1:1 Replica Header Section */}
        <div className="grid grid-cols-12 gap-4 lg:gap-1 min-h-[140px] h-auto lg:h-[140px]">
            <div className="col-span-12 lg:col-span-7 bg-[#06b6d4] rounded-sm overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b border-black/10 flex justify-between items-center">
                    <h1 className="text-xl lg:text-3xl font-black text-black tracking-tighter uppercase break-words pr-2">{activityData.name}</h1>
                    <div className="w-10 h-10 bg-black/10 rounded-sm flex items-center justify-center">
                        <Footprints className="w-6 h-6 text-black" />
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-3 divide-x divide-black/10">
                    <StatPanel label="Moving time" value={durationFormatted} variant="cyan" size="lg" />
                    <StatPanel label="Distance" value={distance} unit={getDistanceUnit(unitPreference)} variant="cyan" size="lg" />
                    <StatPanel label="Pace" value={pace} unit={`/${getDistanceUnit(unitPreference)}`} variant="cyan" size="lg" />
                </div>
            </div>

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
                <div className="bg-zinc-900 rounded-sm p-4 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Athlete</span>
                        <span className="text-xs font-black text-white uppercase">{user.displayName}</span>
                     </div>
                     <Activity className="absolute -bottom-2 -right-2 w-12 h-12 text-zinc-800 opacity-20" />
                </div>
            </div>
        </div>

        {/* Sub Metrics Row */}
        <div className="grid grid-cols-12 gap-1 min-h-[80px] h-auto lg:h-[80px]">
            <div className="col-span-12 lg:col-span-9 grid grid-cols-2 lg:grid-cols-6 gap-1">
                  <StatPanel label="Elapsed" value={elapsedFormatted} size="sm" />
                  <StatPanel 
                      label="Elevation" 
                      value={activityData.elevation?.toFixed(0) || "0"} 
                      unit="m" 
                      size="sm" 
                  />
                  <StatPanel label="Heart Rate" value={activityData.averageHeartRate || "—"} unit="bpm" variant="zinc" size="sm" />
                  <StatPanel label="Suffer Score" value={activityData.sufferScore || "—"} variant={activityData.sufferScore && activityData.sufferScore > 100 ? "red" : "zinc"} size="sm" />
                  <StatPanel label="Calories" value={activityData.calories || "—"} size="sm" />
                  <StatPanel label="Type" value={activityData.sportType || "—"} size="sm" />
            </div>
            <div className="col-span-12 lg:col-span-3 bg-zinc-900/50 border border-zinc-900 rounded-sm flex items-center justify-between px-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Date</span>
                  <span className="text-xs font-black text-zinc-400">{new Date(activityData.startDateTime || "").toLocaleDateString()}</span>
            </div>
        </div>

        {/* Visual Content: Map & Charts */}
        <div className="grid grid-cols-12 gap-4">
            <div className={`col-span-12 ${activityData.polyline ? "lg:col-span-7" : "lg:col-span-12"}`}>
                <ActivityCharts stream={stream} unit={unitPreference} />
            </div>

            {activityData.polyline && (
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                    <div className="h-[400px]">
                        <AiThumbnail 
                            activityId={activityId} 
                            thumbnailUrl={activityData.aiThumbnailUrl} 
                            thumbnailPrompt={activityData.aiThumbnailPrompt}
                            videoUrl={activityData.aiVideoUrl || null}
                            activityName={activityData.name || undefined}
                            polyline={activityData.polyline}
                            stats={{
                                distance: distance + (unitPreference === 'imperial' ? ' mi' : ' km'),
                                movingTime: durationFormatted,
                                elevation: (activityData.elevation?.toFixed(0) || "0") + " m"
                            }}
                            isReadOnly={true}
                        />
                    </div>
                    <div className="h-[600px] relative">
                        <div className="absolute inset-0 bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden">
                            <MapWrapper
                                latlng={stream?.latlng as [number, number][]} 
                                summaryPolyline={activityData.polyline}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Insights & Letter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
                {insight && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/5 border border-purple-500/20 rounded-lg p-8 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Coach Analysis</h2>
                        </div>
                        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                            {insight.editedText || insight.insightText}
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-4">
                {letter && (
                    <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-8 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Run Letter</h2>
                        </div>
                        <div className="text-zinc-500 leading-relaxed italic font-serif text-lg">
                            "{letter.editedText || letter.letterText}"
                        </div>
                    </div>
                )}
            </div>
        </div>
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
