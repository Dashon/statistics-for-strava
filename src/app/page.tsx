import { getFeaturedProfile } from "@/app/actions/modular-profile";
import { ModularProfile } from "@/components/profile/ModularProfile";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from 'next/link';

// Allow this page to be dynamic to pick up ENV changes or DB updates
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const username = process.env.NEXT_PUBLIC_FEATURED_ATHLETE_USERNAME || 'qt';
  
  const profileData = await getFeaturedProfile(username);

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
         <h1 className="text-4xl font-black italic text-cyan-600 mb-4">PROFILE NOT FOUND</h1>
         <p className="text-zinc-400 max-w-md mb-8">
           The featured athlete profile "{username}" could not be found. 
           Please check the configuration or ensure the user has a public profile.
         </p>
         <Link href="/dashboard" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
            Go to Dashboard
         </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={
       <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
       </div>
    }>
       <ModularProfile data={profileData} />
    </Suspense>
  );
}
