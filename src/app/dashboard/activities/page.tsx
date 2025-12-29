
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAthleteProfile } from "@/app/actions/profile";
import { type MeasurementUnit } from "@/lib/units";
import ActivitiesPageContent from "@/components/dashboard/ActivitiesPageContent";

export const metadata: Metadata = {
  title: "Activities | QT Statistics for Strava",
  description: "Browse all your synced Strava activities with detailed metrics and insights.",
};

export default async function ActivitiesPage() {
  const session = await auth() as any;
  if (!session?.userId) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  return (
    <div className="p-8">
      <ActivitiesPageContent unitPreference={unitPreference} />
    </div>
  );
}
