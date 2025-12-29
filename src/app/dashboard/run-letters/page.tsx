
import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters, coachingInsights, generationStatus } from "@/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
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
  const session = await auth();
  if (!session) redirect("/");

  // Only fetch recent activities (last 3 months) for initial page load
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const activities = await db.query.activity.findMany({
    where: eq(activity.sportType, "Run"),
    orderBy: [desc(activity.startDateTime)],
    limit: 20, // Start with just 20 activities
  });

  const activityIds = activities.map(a => a.activityId);

  const letters = await db.query.runLetters.findMany({
    where: (letter, { inArray }) => inArray(letter.activityId, activityIds),
  });
  const letterMap = new Map(letters.map((l) => [l.activityId, l]));

  const insights = await db.query.coachingInsights.findMany({
    where: (insight, { inArray }) => inArray(insight.activityId, activityIds),
  });
  const insightMap = new Map(insights.map((i) => [i.activityId, i]));

  const statuses = await db.query.generationStatus.findMany({
    where: (status, { inArray }) => inArray(status.activityId, activityIds),
  });
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
