
import { Sidebar } from "@/components/Sidebar";
import { getAthleteProfile } from "@/app/actions/profile";
import { getEffectiveDisplayName, getEffectiveProfilePicture } from "@/app/actions/profile-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAthleteProfile();
  
  const sidebarProfile = profile ? {
    displayName: getEffectiveDisplayName(profile),
    profilePicture: getEffectiveProfilePicture(profile),
  } : null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar profile={sidebarProfile} />
      <main className="flex-1 overflow-y-auto lg:ml-0 pt-16 lg:pt-0">
          {children}
      </main>
    </div>
  );
}
