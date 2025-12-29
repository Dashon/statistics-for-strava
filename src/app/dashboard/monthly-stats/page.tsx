
import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { getAthleteProfile } from "@/app/actions/profile";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";

export default async function MonthlyStatsPage() {
  const session = (await auth()) as any;
  if (!session) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  const monthlyStats = await db.execute(sql`
    SELECT
        to_char("startdatetime", 'YYYY-MM') as month,
        count(*) as count,
        sum(distance) as total_distance
    FROM activity
    WHERE user_id = ${session.userId}
    GROUP BY month
    ORDER BY month DESC
  `);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          MONTHLY STATS
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Endurance Over Time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyStats.map((row: any) => (
            <div key={row.month} className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] flex flex-col gap-6 group hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    <span className="font-black text-sm uppercase tracking-widest">{row.month}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-4xl font-black text-white block">
                            {convertDistance(Number(row.total_distance), unitPreference).toFixed(0)}
                            <span className="text-lg text-zinc-600 font-bold ml-2 uppercase">{getDistanceUnit(unitPreference)}</span>
                        </span>
                    </div>
                     <div className="text-right">
                         <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest block mb-1">Sessions</span>
                         <span className="text-2xl font-black text-white">{row.count}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
