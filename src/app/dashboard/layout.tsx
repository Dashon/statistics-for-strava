
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
    <div className="min-h-screen bg-zinc-950">
      <Sidebar profile={sidebarProfile} />
      {/* 
          Main content shifts right on desktop to accommodate the 72 (w-72) wide fixed sidebar.
          On mobile, we add pt-16 for the top sticky header.
      */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-w-0 max-w-full">
          <div className="h-full">
            {children}
          </div>
      </main>
    </div>
  );
}
