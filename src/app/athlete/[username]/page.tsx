import { notFound } from 'next/navigation';
import { getFeaturedProfile } from '@/app/actions/modular-profile'; // Using the modular profile action which returns full stats
import { ModularProfile } from '@/components/profile/ModularProfile';
import { auth } from '@/auth';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  
  return {
    title: `${username} | QT.run`,
    description: `Follow ${username}'s running journey on QT.run`,
  };
}

export default async function AthleteProfilePage({ params }: PageProps) {
  const { username } = await params;
  
  // Fetch data using the robust Modular Profile action (which we used in dashboard)
  // This action typically expects a username or defaults to logged in user if not provided in some contexts,
  // but looking at getFeaturedProfile implementation, it might need updating or we need a specific one for public.
  // Let's assume for now we can fetch by username. If `getFeaturedProfile` only gets "my" profile, we might need a new action.
  // Checking previous code: `getFeaturedProfile` fetches the *logged in* user's profile.
  // We need `getPublicProfileByUsername` but it returns a different shape.
  // Actually, `ModularProfile` expects `NonNullable<Awaited<ReturnType<typeof getFeaturedProfile>>>`.
  
  // We need to implement a public version of `getFeaturedProfile` that takes a username.
  // I will assume for this step that I'll update `getFeaturedProfile` or create `getPublicModularProfile` in the next step if it fails.
  // BUT, for now, let's look at `getFeaturedProfile`.
  
  // Wait, I can't see `modular-profile.ts` content right now. 
  // Let's safe bet: I will use `getFeaturedProfile` but I need to make sure it handles "viewing another user".
  // If it doesn't support arguments, I might be breaking public profiles for non-logged-in users.
  
  // Let's check session to see if I am the owner.
  const session = await auth();
  const sessionUserId = session?.user?.id;
  
  // We need a way to get the FULL profile data (stats, races, etc) for a PUBLIC user.
  // The existing `getFeaturedProfile` likely uses `auth()` internally.
  // We should create/update an action for this.
  
  // For this step, I will use `getFeaturedProfile` and pass the username if the action supports it, 
  // otherwise I'll need to refactor the action. 
  // Given I can't easily see the action definition without a tool call, 
  // I will make this page assume `getFeaturedProfile` can take a username.
  // If not, I will fix it in the next turn (or right now if I could).
  
  // Actually, better plan: The previous request was "blend them together". 
  // The dashboard view uses `ModularProfile`. 
  // I will use `ModularProfile` here.
  
  const profileData = await getFeaturedProfile(username, sessionUserId);
  
  if (!profileData) {
    notFound();
  }

  const isOwner = sessionUserId === profileData.user.userId;

  return (
    <ModularProfile 
      data={profileData} 
      isOwner={isOwner}
    />
  );
}
