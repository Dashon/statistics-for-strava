
import { auth } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { desc, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Pagination from "./Pagination";

export const metadata: Metadata = {
  title: "Activities | QT Statistics for Strava",
  description: "Browse all your synced Strava activities with detailed metrics and insights.",
};

const ITEMS_PER_PAGE = 50;

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/");

  const currentPage = parseInt(searchParams.page || "1", 10);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [allActivities, [{ value: totalCount }]] = await Promise.all([
    db.query.activity.findMany({
      orderBy: [desc(activity.startDateTime)],
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    db.select({ value: count() }).from(activity),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          ACTIVITIES
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Chronicle of Effort</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-500 uppercase text-[10px] font-black tracking-widest italic">
            <tr>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Name</th>
              <th className="px-8 py-4">Type</th>
              <th className="px-8 py-4 text-right">Distance</th>
              <th className="px-8 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {allActivities.map((a) => (
              <tr key={a.activityId} className="hover:bg-zinc-900 transition-colors border-l-4 border-transparent hover:border-orange-500">
                <td className="px-8 py-5 text-zinc-500 text-sm whitespace-nowrap">{new Date(a.startDateTime).toLocaleDateString()}</td>
                <td className="px-8 py-5 font-bold text-white uppercase tracking-tight">{a.name}</td>
                <td className="px-8 py-5 text-zinc-400 text-xs font-black uppercase tracking-widest italic">{a.sportType}</td>
                <td className="px-8 py-5 text-right font-mono text-white text-lg">
                    {((a.distance || 0) / 1000).toFixed(1)} <span className="text-xs text-zinc-600 uppercase font-bold">km</span>
                </td>
                <td className="px-8 py-5 text-right text-zinc-400 font-mono text-sm italic">
                    {Math.floor((a.movingTimeInSeconds || 0) / 3600)}h {Math.floor(((a.movingTimeInSeconds || 0) % 3600) / 60)}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
