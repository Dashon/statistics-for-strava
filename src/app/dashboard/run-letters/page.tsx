
import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters } from "@/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import GenerateLettersButton from "./GenerateLettersButton";

export default async function RunLettersPage() {
  const session = await auth();
  if (!session) redirect("/");

  const activities = await db.query.activity.findMany({
    where: eq(activity.sportType, "Run"),
    orderBy: [desc(activity.startDateTime)],
  });

  const letters = await db.query.runLetters.findMany();
  const letterMap = new Map(letters.map((l) => [l.activityId, l]));

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {activities.map((run) => {
          const letter = letterMap.get(run.activityId);
          return (
            <div key={run.activityId} className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] flex flex-col gap-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-6xl font-black italic">QT</span>
                </div>
                <div className="space-y-2">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">{new Date(run.startDateTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</span>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{run.name}</h3>
                </div>
                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-900/50">
                    {letter ? (
                        <p className="text-zinc-400 text-sm leading-relaxed italic line-clamp-6">{letter.letterText}</p>
                    ) : (
                        <p className="text-zinc-700 text-sm italic py-8 text-center uppercase tracking-widest font-black">No letter generated yet</p>
                    )}
                </div>
                {letter && <div className="mt-auto pt-4 flex justify-end"><span className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">READ FULL REPORT &rarr;</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
