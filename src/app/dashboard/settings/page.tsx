import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAthleteProfile } from "@/app/actions/profile";
import ProfileForm from "./ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | QT Statistics for Strava",
  description: "Manage your athlete profile and performance settings.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const profile = await getAthleteProfile();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white italic tracking-tight">SETTINGS</h1>
        <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold">
          Manage your athlete profile
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="glass rounded-lg p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Athlete Profile</h2>
            <p className="text-sm text-zinc-400">
              These settings help personalize your AI coaching insights and performance analysis.
            </p>
          </div>

          <ProfileForm initialData={profile} />
        </div>
      </div>
    </div>
  );
}
