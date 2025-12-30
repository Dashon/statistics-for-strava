
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getAthleteProfile } from "@/app/actions/profile";
import { type MeasurementUnit } from "@/lib/units";
import SyncButton from "./SyncButton";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { db } from "@/db";
import { athleteReadiness } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata = {
  title: "Dashboard | QT Statistics for Strava",
  description: "View your activity statistics, recent workouts, and performance insights.",
};

export default async function DashboardPage() {
  const session = (await auth()) as any;
  if (!session?.userId) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  // Fetch latest Agent Readiness Score
  const latestReadiness = await db.select().from(athleteReadiness)
    .where(eq(athleteReadiness.userId, session.userId))
    .orderBy(desc(athleteReadiness.date))
    .limit(1)
    .then(res => res[0] || null);

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* Header with Sync */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">Dashboards &gt; Strava Athlete Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <SyncButton />
          <form action={async () => { "use server"; await signOut(); }}>
            <button className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest font-bold">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <DashboardContent 
        unitPreference={unitPreference} 
        readiness={latestReadiness}
      />
    </div>
  );
}
