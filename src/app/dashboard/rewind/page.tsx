
import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Trophy, Zap, Fuel, TreeDeciduous, CalendarDays } from "lucide-react";

export default async function RewindPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await auth();
  if (!session) redirect("/");

  const { year } = await searchParams;
  const availableYears = await db.execute(sql`
    SELECT DISTINCT to_char("startdatetime", 'YYYY') as yr
    FROM activity
    ORDER BY yr DESC
  `);

  const activeYear = year || (availableYears[0] as any)?.yr || new Date().getFullYear().toString();

  const stats = await db.execute(sql`
    SELECT
        count(*) as activity_count,
        sum(CAST(CAST(data AS JSONB)->>'distance' AS NUMERIC) / 1000) as total_distance,
        sum(CAST(CAST(data AS JSONB)->>'total_elevation_gain' AS NUMERIC)) as total_elevation,
        sum(CAST(CAST(data AS JSONB)->>'moving_time' AS NUMERIC) / 3600) as total_hours,
        sum(CAST(CAST(data AS JSONB)->>'calories' AS NUMERIC)) as total_calories,
        count(DISTINCT to_char("startdatetime", 'YYYY-MM-DD')) as active_days
    FROM activity
    WHERE to_char("startdatetime", 'YYYY') = ${activeYear}
  `);

  const s = (stats[0] as any) || {};
  const carbonSaved = (Number(s.total_distance || 0) * 0.2178).toFixed(1);

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent italic">
                {activeYear} REWIND
            </h1>
            <p className="text-zinc-500 text-lg mt-2 uppercase tracking-[0.2em] font-medium italic">Your Year in Motion</p>
        </div>
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            {availableYears.map((ry: any) => (
                <a key={ry.yr} href={`/dashboard/rewind?year=${ry.yr}`} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeYear === ry.yr ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>{ry.yr}</a>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-4">Distance</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{Number(s.total_distance || 0).toFixed(0)}</span>
                  <span className="text-xl text-zinc-600 font-bold uppercase">km</span>
              </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-4">Elevation</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{Number(s.total_elevation || 0).toFixed(0)}</span>
                  <span className="text-xl text-zinc-600 font-bold uppercase">m</span>
              </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] relative overflow-hidden group">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-4">Hours</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{Number(s.total_hours || 0).toFixed(0)}</span>
                  <span className="text-xl text-zinc-600 font-bold uppercase">hrs</span>
              </div>
          </div>
          <div className="bg-green-600 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-green-600/20">
              <span className="text-green-200 text-[10px] font-black uppercase tracking-widest block mb-4">CO2 Offset</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{carbonSaved}</span>
                  <span className="text-xl text-green-100 font-bold uppercase">kg</span>
              </div>
          </div>
      </div>
    </div>
  );
}
