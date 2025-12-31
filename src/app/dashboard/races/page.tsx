import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRaces } from "@/app/actions/races";
import { RaceManagement } from "@/components/races/RaceManagement";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Race Management | QT Statistics',
  description: 'Manage your race calendar and results.',
};

export default async function RaceDashboardPage() {
  const session = await auth() as any;
  if (!session?.userId) redirect("/");

  // Fetch all races (upcoming and completed)
  const races = await getRaces('all');

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
       <RaceManagement races={races} />
    </div>
  );
}
