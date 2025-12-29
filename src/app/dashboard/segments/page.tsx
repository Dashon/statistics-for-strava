
import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SegmentsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const segments = await db.execute(sql`
    SELECT 
        s.segmentid, 
        s.name, 
        count(se.segmenteffortid) as effort_count,
        min(CAST(CAST(se.data AS JSONB)->>'moving_time' AS INTEGER)) as best_time,
        max(se.startdatetime) as last_effort
    FROM segment s
    LEFT JOIN segmenteffort se ON s.segmentid = se.segmentid
    GROUP BY s.segmentid, s.name
    ORDER BY last_effort DESC
    LIMIT 100
  `);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          SEGMENTS
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Battlegrounds of Excellence</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-zinc-800">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest italic">Name</th>
              <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest italic">Efforts</th>
              <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest italic">PR</th>
              <th className="px-8 py-5 text-xs font-black text-zinc-500 uppercase tracking-widest italic text-right">Last Effort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {segments.map((s: any) => (
              <tr key={s.segmentid} className="hover:bg-zinc-900/50 transition-colors group">
                <td className="px-8 py-6">
                    <span className="text-white font-bold group-hover:text-orange-500 transition-colors uppercase tracking-tight">{s.name}</span>
                </td>
                <td className="px-8 py-6 text-zinc-400 font-mono text-sm">{s.effort_count}</td>
                <td className="px-8 py-6 text-zinc-400 font-mono text-sm">
                    {s.best_time ? `${Math.floor(s.best_time / 60)}:${(s.best_time % 60).toString().padStart(2, '0')}` : "-"}
                </td>
                <td className="px-8 py-6 text-zinc-500 text-sm italic text-right">
                  {new Date(s.last_effort).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
