
import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters, coachingInsights } from "@/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import GenerateLettersButton from "./GenerateLettersButton";
import { Heart, TrendingUp, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Run Letters | QT Statistics for Strava",
  description: "AI-generated personalized letters for your running activities.",
};

export default async function RunLettersPage() {
  const session = await auth();
  if (!session) redirect("/");

  const activities = await db.query.activity.findMany({
    where: eq(activity.sportType, "Run"),
    orderBy: [desc(activity.startDateTime)],
  });

  const letters = await db.query.runLetters.findMany();
  const letterMap = new Map(letters.map((l) => [l.activityId, l]));

  const insights = await db.query.coachingInsights.findMany();
  const insightMap = new Map(insights.map((i) => [i.activityId, i]));

  const missingCount = activities.filter((a) => !letterMap.has(a.activityId)).length;

  return (
    <div className="p-8 space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent italic uppercase tracking-tighter">
            RUN LETTERS
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Poetry of Pavement</p>
        </div>
        <GenerateLettersButton missingCount={missingCount} activities={activities.filter(a => !letterMap.has(a.activityId)).map(a => a.activityId)} />
      </div>

      <div className="space-y-8 pb-20">
        {activities.map((run) => {
          const letter = letterMap.get(run.activityId);
          const insight = insightMap.get(run.activityId);
          const distanceMi = run.distance ? (run.distance / 1609.34).toFixed(2) : "0";
          const durationMin = run.movingTimeInSeconds ? Math.floor(run.movingTimeInSeconds / 60) : 0;

          return (
            <div key={run.activityId} className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
              {/* Activity Header */}
              <div className="bg-zinc-900/50 p-6 border-b border-zinc-800">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">
                      {new Date(run.startDateTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}
                    </span>
                    <Link href={`/dashboard/activities/${run.activityId}`}>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight hover:text-orange-500 transition-colors">
                        {run.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-500"><span className="text-white font-bold">{distanceMi}</span> mi</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-zinc-500"><span className="text-white font-bold">{durationMin}</span> min</span>
                      {run.averageHeartRate && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-white font-bold">{run.averageHeartRate}</span> bpm
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/activities/${run.activityId}`}
                    className="bg-zinc-800 hover:bg-orange-500 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-3 h-3" />
                    View Details
                  </Link>
                </div>
              </div>

              {/* Content Grid: Letter + Coaching Insight */}
              <div className="grid md:grid-cols-2 divide-x divide-zinc-800">
                {/* Run Letter */}
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 text-orange-500 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest">Run Letter</span>
                  </div>
                  <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900/50 min-h-[200px]">
                    {letter ? (
                      <p className="text-zinc-400 text-sm leading-relaxed italic">{letter.letterText}</p>
                    ) : (
                      <p className="text-zinc-700 text-sm italic py-8 text-center uppercase tracking-widest font-black">
                        No letter generated yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Coaching Insight */}
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 text-purple-500 mb-4">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">AI Coach</span>
                  </div>
                  <div className="bg-purple-500/5 p-6 rounded-2xl border border-purple-500/20 min-h-[200px]">
                    {insight ? (
                      <>
                        {insight.runClassification && (
                          <div className="bg-purple-500/10 rounded-lg px-3 py-1 inline-block mb-3">
                            <span className="text-purple-400 font-bold uppercase text-xs tracking-widest">
                              {insight.runClassification}
                            </span>
                          </div>
                        )}
                        <p className="text-zinc-400 text-sm leading-relaxed line-clamp-8">
                          {insight.editedText || insight.insightText}
                        </p>
                      </>
                    ) : (
                      <p className="text-zinc-700 text-sm italic py-8 text-center uppercase tracking-widest font-black">
                        No coaching insight yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
