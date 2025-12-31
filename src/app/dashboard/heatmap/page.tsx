
import { auth } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import ActivitiesHeatmap from "./ActivitiesHeatmap";

export default async function HeatmapPage() {
  const session = await auth() as any;
  if (!session?.userId) redirect("/");

  // SECURITY + PERFORMANCE: Only fetch user's activities, select minimal columns
  // Limit to last 500 activities to prevent memory issues with large datasets
  const allActivities = await db.query.activity.findMany({
    where: eq(activity.userId, session.userId),
    columns: { polyline: true, data: true },
    orderBy: (activity, { desc }) => [desc(activity.startDateTime)],
    limit: 500,
  });

  const polylines = allActivities
    .map((a: any) => a.polyline || (a.data as any)?.map?.summary_polyline)
    .filter((p) => typeof p === "string" && p.length > 0);

  return (
    <div className="p-8 space-y-8 h-screen flex flex-col">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent italic">
          HEATMAP
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Paths of Glory</p>
      </div>
      <div className="flex-1">
        <ActivitiesHeatmap polylines={polylines} />
      </div>
    </div>
  );
}
