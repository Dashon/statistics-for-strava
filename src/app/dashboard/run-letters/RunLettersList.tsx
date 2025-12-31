"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, TrendingUp, Zap, Loader2, Globe, Lock } from "lucide-react";
import { getGenerationStatuses } from "@/app/actions/trigger-jobs";
import { toggleLetterVisibility } from "@/app/actions/letters";

type Activity = {
  activityId: string;
  name: string | null;
  startDateTime: string;
  distance: number | null;
  movingTimeInSeconds: number | null;
  averageHeartRate: number | null;
};

type Letter = {
  activityId: string;
  letterText: string;
  isPublic: boolean | null;
};

type Insight = {
  activityId: string;
  runClassification: string | null;
  insightText: string;
  editedText: string | null;
};

type Status = {
  activityId: string;
  letterStatus: string;
  coachingStatus: string;
  letterError: string | null;
  coachingError: string | null;
};

export default function RunLettersList({
  activities,
  letterMap: initialLetterMap,
  insightMap: initialInsightMap,
  statusMap: initialStatusMap,
}: {
  activities: Activity[];
  letterMap: Map<string, Letter>;
  insightMap: Map<string, Insight>;
  statusMap: Map<string, Status>;
}) {
  const router = useRouter();
  const [statusMap, setStatusMap] = useState(initialStatusMap);

  // Poll for status updates every 2 seconds if there are pending/generating items
  useEffect(() => {
    const hasPending = Array.from(statusMap.values()).some(
      (s) =>
        s.letterStatus === 'pending' ||
        s.letterStatus === 'generating' ||
        s.coachingStatus === 'pending' ||
        s.coachingStatus === 'generating'
    );

    if (!hasPending) return;

    const interval = setInterval(async () => {
      const activityIds = activities.map((a) => a.activityId);
      const statuses = await getGenerationStatuses(activityIds);
      const newStatusMap = new Map(statuses.map((s) => [s.activityId, s]));
      setStatusMap(newStatusMap);

      // Refresh the page when all are complete
      const allComplete = statuses.every(
        (s) =>
          (s.letterStatus === 'completed' || s.letterStatus === 'failed') &&
          (s.coachingStatus === 'completed' || s.coachingStatus === 'failed')
      );

      if (allComplete) {
        router.refresh();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [statusMap, activities, router]);

  return (
    <div className="space-y-8 pb-20">
      {activities.map((run) => {
        const letter = initialLetterMap.get(run.activityId);
        const insight = initialInsightMap.get(run.activityId);
        const status = statusMap.get(run.activityId);
        const distanceMi = run.distance ? (run.distance / 1609.34).toFixed(2) : "0";
        const durationMin = run.movingTimeInSeconds ? Math.floor(run.movingTimeInSeconds / 60) : 0;

        const isLetterGenerating = status?.letterStatus === 'generating';
        const isCoachingGenerating = status?.coachingStatus === 'generating';

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
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight hover:text-cyan-500 transition-colors">
                      {run.name || 'Unnamed Activity'}
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
                  className="bg-zinc-800 hover:bg-cyan-500 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-cyan-500">
                    <span className="text-xs font-black uppercase tracking-widest">Run Letter</span>
                    {isLetterGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  
                  {letter && !isLetterGenerating && (
                    <button
                      onClick={async () => {
                        const newStatus = !letter.isPublic;
                        const res = await toggleLetterVisibility(run.activityId, newStatus);
                        if (res.success) {
                          router.refresh();
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        letter.isPublic 
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20" 
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-400"
                      }`}
                    >
                      {letter.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          Private
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900/50 min-h-[200px]">
                  {isLetterGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                      <span className="ml-3 text-zinc-500 text-sm uppercase tracking-widest font-black">
                        Generating...
                      </span>
                    </div>
                  ) : letter ? (
                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{letter.letterText}</p>
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
                  {isCoachingGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="bg-purple-500/5 p-6 rounded-2xl border border-purple-500/20 min-h-[200px]">
                  {isCoachingGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      <span className="ml-3 text-zinc-500 text-sm uppercase tracking-widest font-black">
                        Analyzing...
                      </span>
                    </div>
                  ) : insight ? (
                    <>
                      {insight.runClassification && (
                        <div className="bg-purple-500/10 rounded-lg px-3 py-1 inline-block mb-3">
                          <span className="text-purple-400 font-bold uppercase text-xs tracking-widest">
                            {insight.runClassification}
                          </span>
                        </div>
                      )}
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-8">
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
  );
}
