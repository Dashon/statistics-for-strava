
import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters, coachingInsights, generationStatus } from "@/db/schema";
import { desc, eq, isNull, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import GenerateLettersButton from "./GenerateLettersButton";
import RunLettersList from "./RunLettersList";
import { Heart, TrendingUp, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Run Letters | QT Statistics for Strava",
  description: "AI-generated personalized letters for your running activities.",
};

export default async function RunLettersPage() {
  const session = await auth() as any;
  if (!session?.userId) redirect("/");

  // Only fetch recent activities (last 3 months) for initial page load
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // SECURITY FIX: Filter activities by userId
  const activities = await db.query.activity.findMany({
    where: and(
      eq(activity.sportType, "Run"),
      eq(activity.userId, session.userId)
    ),
    orderBy: [desc(activity.startDateTime)],
    limit: 20, // Start with just 20 activities
    columns: {
      activityId: true,
      name: true,
      startDateTime: true,
      distance: true,
      movingTimeInSeconds: true,
      averageHeartRate: true,
    }
  });

  const activityIds = activities.map(a => a.activityId);

  // Parallel fetch related data
  const [letters, insights, statuses] = await Promise.all([
    db.query.runLetters.findMany({
      where: (letter, { inArray }) => inArray(letter.activityId, activityIds),
    }),
    db.query.coachingInsights.findMany({
      where: (insight, { inArray }) => inArray(insight.activityId, activityIds),
    }),
    db.query.generationStatus.findMany({
      where: (status, { inArray }) => inArray(status.activityId, activityIds),
    })
  ]);

  const letterMap = new Map(letters.map((l) => [l.activityId, l]));
  const insightMap = new Map(insights.map((i) => [i.activityId, i]));
  const statusMap = new Map(statuses.map((s) => [s.activityId, s]));

  const missingActivities = activities.filter((a) => !letterMap.has(a.activityId));

  return (
    <div className="p-8 space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent italic uppercase tracking-tighter">
            RUN LETTERS
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Poetry of Pavement</p>
        </div>
        <GenerateLettersButton
          missingCount={missingActivities.length}
          activities={missingActivities.map(a => a.activityId)}
        />
      </div>

      <RunLettersList
        activities={activities}
        letterMap={letterMap}
        insightMap={insightMap}
        statusMap={statusMap}
      />
    </div>
  );
}
