
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { redirect } from "next/navigation";
import SyncButton from "./SyncButton";
import { MoveRight, Zap, Target, History, Map as MapIcon, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const session = (await auth()) as any;
  if (!session) redirect("/");

  const totalActivities = await db.query.activity.findMany();
  const recentActivities = totalActivities
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
    .slice(0, 5);

  return (
    <div className="p-8 space-y-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tight">DASHBOARD</h1>
          <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold">Welcome back, Athlete</p>
        </div>
        <div className="flex items-center gap-4">
          <SyncButton />
          <form action={async () => { "use server"; await signOut(); }}>
            <button className="text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">Sign Out</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] flex flex-col gap-4">
              <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Total Activities</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white">{totalActivities.length}</span>
              </div>
          </div>
          <div className="bg-orange-500 p-8 rounded-[2rem] flex flex-col gap-4 text-white shadow-xl shadow-orange-500/20">
              <span className="text-orange-200 text-xs font-black uppercase tracking-[0.2em]">Total Distance</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black leading-none">
                    {(totalActivities.reduce((acc, a) => acc + (a.distance || 0), 0) / 1000).toFixed(0)}
                  </span>
                  <span className="text-xl font-bold italic uppercase">km</span>
              </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] flex flex-col gap-4">
                <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Total Elevation</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white">
                        {totalActivities.reduce((acc, a) => acc + (a.elevation || 0), 0).toFixed(0)}
                    </span>
                    <span className="text-xl font-bold italic text-zinc-500 uppercase">m</span>
                </div>
          </div>
      </div>

      <div className="space-y-6">
          <div className="flex justify-between items-end">
             <h2 className="text-2xl font-black text-white italic italic">RECENT ACTIVITIES</h2>
             <a href="/dashboard/activities" className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                 View All <MoveRight className="w-4 h-4" />
             </a>
          </div>
          <div className="grid gap-4">
              {recentActivities.map((a: any) => (
                  <div key={a.activityId} className="group bg-zinc-950 border border-zinc-900 hover:border-zinc-800 p-6 rounded-2xl flex items-center justify-between transition-all">
                      <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                               <Zap className="w-6 h-6 text-orange-500" />
                           </div>
                           <div>
                               <h3 className="text-white font-bold text-lg leading-none">{a.name}</h3>
                               <div className="flex items-center gap-3 mt-2">
                                   <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{new Date(a.startDateTime).toLocaleDateString()}</span>
                                   <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                   <span className="text-orange-500 text-xs font-black uppercase tracking-widest">{a.sportType}</span>
                               </div>
                           </div>
                      </div>
                      <div className="flex items-center gap-12">
                          <div className="text-right">
                               <span className="text-white font-black text-xl block leading-none">{((a.distance || 0) / 1000).toFixed(1)} <span className="text-xs text-zinc-600 font-bold uppercase">km</span></span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
