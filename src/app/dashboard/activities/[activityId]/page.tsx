import { auth } from "@/auth";
import { db } from "@/db";
import { activity, coachingInsights, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { Zap, MapPin, Trophy, Heart, TrendingUp, Clock } from "lucide-react";
import type { Metadata } from "next";
import { generateCoachingInsight, getCoachingInsight } from "@/app/actions/coaching";

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

  // Fetch run letter if exists
  const letter = await db.query.runLetters.findFirst({
    where: eq(runLetters.activityId, activityId),
  });

  const distanceMi = activityData.distance ? (activityData.distance / 1609.34).toFixed(2) : "0";
  const distanceKm = activityData.distance ? (activityData.distance / 1000).toFixed(2) : "0";
  const durationFormatted = formatDuration(activityData.movingTimeInSeconds || 0);
  const paceMinPerMi = activityData.distance && activityData.movingTimeInSeconds
    ? formatPace((activityData.movingTimeInSeconds / 60) / (activityData.distance / 1609.34))
    : "0:00";

  return (
    <div className="p-8 space-y-6 max-w-[1800px] mx-auto">
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

      {/* Key Metrics - Grafana Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Moving Time */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Moving time</span>
          </div>
          <div className="text-4xl font-black text-white">{durationFormatted}</div>
        </div>

        {/* Distance */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-2">
            Distance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{distanceMi}</span>
            <span className="text-lg text-zinc-600 font-bold">mi</span>
          </div>
        </div>

        {/* Pace */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-2">
            Pace
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{paceMinPerMi}</span>
            <span className="text-lg text-zinc-600 font-bold">/mi</span>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="bg-gradient-to-br from-red-500/10 to-pink-600/5 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Heart Rate</span>
          </div>
          <div className="text-4xl font-black text-white">
            {activityData.averageHeartRate || "—"}
          </div>
        </div>

        {/* Elevation */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-2">
            Elevation
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">
              {activityData.elevation?.toFixed(0) || "0"}
            </span>
            <span className="text-lg text-zinc-600 font-bold">ft</span>
          </div>
        </div>

        {/* Calories */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-2">
            Calories
          </span>
          <div className="text-4xl font-black text-white">
            {activityData.calories || "—"}
          </div>
        </div>

        {/* Power (if available) */}
        {activityData.averagePower && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <span className="text-zinc-500 text-xs font-black uppercase tracking-widest block mb-2">
              Avg Power
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{activityData.averagePower}</span>
              <span className="text-lg text-zinc-600 font-bold">W</span>
            </div>
          </div>
        )}

        {/* Kudos */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Kudos</span>
          </div>
          <div className="text-4xl font-black text-white">
            {activityData.kudoCount || 0}
          </div>
        </div>
      </div>

      {/* AI Coaching Insights */}
      {insight && (
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-600/5 border border-purple-500/20 rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                AI Coach Analysis
              </h2>
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">
                Powered by Claude Sonnet 4.5
              </p>
            </div>
          </div>

          {insight.runClassification && (
            <div className="bg-zinc-900/50 rounded-xl px-4 py-2 inline-block mb-4">
              <span className="text-purple-400 font-black uppercase text-sm tracking-widest">
                {insight.runClassification}
              </span>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {insight.editedText || insight.insightText}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-xs text-zinc-500 italic">
            Generated {new Date(insight.generatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Run Letter (if exists) */}
      {letter && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8">
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
            Run Letter
          </h2>
          <div className="text-zinc-400 leading-relaxed italic">
            {letter.editedText || letter.letterText}
          </div>
        </div>
      )}

      {/* Placeholder for charts - Will be enhanced with Chart.js */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">
            Heart Rate / Speed
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-700">
            Chart placeholder - Will integrate Chart.js
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">
            Heart Rate Distribution
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-700">
            Chart placeholder - Will integrate Chart.js
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
