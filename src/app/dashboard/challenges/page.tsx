
import { auth } from "@/auth";
import { db } from "@/db";
import { challenge } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session) redirect("/");

  const allChallenges = await db.query.challenge.findMany({
    columns: { challengeId: true, name: true, logoUrl: true, createdOn: true }
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          CHALLENGES
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Badges of Honor</p>
      </div>

      {allChallenges.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">No Challenges Found</h3>
            <p className="text-zinc-500 text-sm">
              Your Strava challenges will appear here once you sync activities that include challenge data.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {allChallenges.map((c) => (
              <div key={c.challengeId} className="flex flex-col items-center gap-4 group">
                  <div className="w-full aspect-square bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-center group-hover:scale-105 group-hover:border-orange-500 transition-all shadow-xl hover:shadow-orange-500/5">
                      {c.logoUrl ? (
                           <img src={c.logoUrl} alt={c.name || "Challenge"} className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                           <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-600">?</div>
                      )}
                  </div>
                  <div className="text-center space-y-1">
                      <span className="text-white font-bold text-xs uppercase tracking-tight block leading-tight">{c.name}</span>
                      <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-black italic">
                          {new Date(c.createdOn).toLocaleDateString('en-US', { month: 'short', year: 'numeric'})}
                      </span>
                  </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
