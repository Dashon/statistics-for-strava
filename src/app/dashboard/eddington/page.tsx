
import { auth } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { redirect } from "next/navigation";
import { calculateEddington } from "@/lib/eddington";

export default async function EddingtonPage() {
  const session = await auth();
  if (!session) redirect("/");

  const allActivities = await db.query.activity.findMany();
  
  const cyclingDistances = allActivities
    .filter((a) => a.sportType === "Ride" || a.sportType === "VirtualRide")
    .map((a) => (a.distance || 0) / 1000);

  const runningDistances = allActivities
    .filter((a) => a.sportType === "Run" || a.sportType === "TrailRun")
    .map((a) => (a.distance || 0) / 1000);

  const cyclingEddington = calculateEddington(cyclingDistances);
  const runningEddington = calculateEddington(runningDistances);

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          EDDINGTON NUMBER
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Your True Endurance Proxy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cycling */}
          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                  <span className="text-[12rem] font-black leading-none italic">E</span>
              </div>
              <div className="relative z-10 space-y-6">
                <span className="bg-orange-500/10 text-orange-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Cycling</span>
                <div className="flex items-baseline gap-4">
                    <span className="text-9xl font-black text-white italic">{cyclingEddington.eddington}</span>
                </div>
                <div className="space-y-2">
                    <p className="text-zinc-400 text-sm font-medium">You have ridden <span className="text-white font-bold">{cyclingEddington.eddington} km</span> at least <span className="text-white font-bold">{cyclingEddington.eddington} times</span>.</p>
                    <p className="text-zinc-600 text-sm italic">Next milestone: {cyclingEddington.next} km ({cyclingEddington.neededForNext} more rides needed)</p>
                </div>
              </div>
          </div>

          {/* Running */}
          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                  <span className="text-[12rem] font-black leading-none italic">E</span>
              </div>
              <div className="relative z-10 space-y-6">
                <span className="bg-blue-500/10 text-blue-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Running</span>
                <div className="flex items-baseline gap-4">
                    <span className="text-9xl font-black text-white italic">{runningEddington.eddington}</span>
                </div>
                <div className="space-y-2">
                    <p className="text-zinc-400 text-sm font-medium">You have run <span className="text-white font-bold">{runningEddington.eddington} km</span> at least <span className="text-white font-bold">{runningEddington.eddington} times</span>.</p>
                    <p className="text-zinc-600 text-sm italic">Next milestone: {runningEddington.next} km ({runningEddington.neededForNext} more runs needed)</p>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}
