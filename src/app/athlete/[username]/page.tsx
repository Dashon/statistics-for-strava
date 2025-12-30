import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProfileByUsername } from '@/app/actions/public-profile';
import { getUpcomingEvents, getBroadcasts } from '@/app/actions/events';
import { PublicProfileHeader } from '@/components/live/PublicProfileHeader';
import { BroadcastCard } from '@/components/live/BroadcastCard';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  
  if (!profile) {
    return { title: 'Profile Not Found' };
  }

  return {
    title: `${profile.displayName || username} | QT.run`,
    description: profile.tagline || `Follow ${profile.displayName || username}'s running journey`,
  };
}

export default async function AthleteProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const [upcomingEvents, broadcasts] = await Promise.all([
    getUpcomingEvents(profile.userId),
    getBroadcasts(profile.userId, 6),
  ]);

  const liveEvent = upcomingEvents.find((e) => e.status === 'live');
  const scheduledEvents = upcomingEvents.filter((e) => e.status === 'scheduled');

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <PublicProfileHeader profile={profile} />

        {/* Live Event Banner */}
        {liveEvent && (
          <Link
            href={`/athlete/${username}/live/${liveEvent.eventId}`}
            className="block mt-6 bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-xl p-6 hover:border-red-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-semibold">LIVE NOW</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{liveEvent.title}</h3>
                {liveEvent.description && (
                  <p className="text-zinc-400 text-sm mt-1">{liveEvent.description}</p>
                )}
              </div>
              <div className="ml-auto">
                <span className="text-orange-500 font-medium">Watch →</span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            {scheduledEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
                <div className="space-y-3">
                  {scheduledEvents.map((event) => (
                    <div
                      key={event.eventId}
                      className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{event.title}</h3>
                          {event.description && (
                            <p className="text-zinc-500 text-sm mt-1">{event.description}</p>
                          )}
                          {event.scheduledStart && (
                            <p className="text-orange-500 text-sm mt-2">
                              {new Date(event.scheduledStart).toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        {event.eventType && (
                          <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full capitalize">
                            {event.eventType}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Broadcast Archive */}
            {broadcasts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Broadcast Archive</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {broadcasts.map((broadcast) => (
                    <BroadcastCard
                      key={broadcast.archiveId}
                      broadcast={broadcast}
                      username={username}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {scheduledEvents.length === 0 && broadcasts.length === 0 && !liveEvent && (
              <div className="text-center py-16 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-zinc-400 font-medium">No events or broadcasts yet</p>
                <p className="text-zinc-500 text-sm mt-1">Check back later for upcoming content</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="font-semibold text-white mb-4">Athlete Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Activities</span>
                  <span className="text-white font-medium">{profile.totalActivities}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Distance</span>
                  <span className="text-white font-medium">
                    {(profile.totalDistance / 1000).toFixed(0)} km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Elevation</span>
                  <span className="text-white font-medium">
                    {profile.totalElevation.toFixed(0)} m
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl border border-orange-500/30 p-6">
              <h3 className="font-semibold text-white mb-2">Track Your Runs</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Join QT.run and get AI-powered coaching, analytics, and your own public profile.
              </p>
              <Link
                href="/"
                className="block w-full text-center py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
