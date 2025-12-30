import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProfileByUsername } from '@/app/actions/public-profile';
import { getEvent, incrementViewerCount } from '@/app/actions/events';
import { auth } from '@/auth';
import { LiveVideoPlayer } from '@/components/live/LiveVideoPlayer';
import { LiveChat } from '@/components/live/LiveChat';
import { LiveTelemetry } from '@/components/live/LiveTelemetry';

interface PageProps {
  params: Promise<{ username: string; eventId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username, eventId } = await params;
  const event = await getEvent(eventId);
  
  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: `${event.title} | ${username} | QT.run`,
    description: event.description || `Watch ${username}'s live event`,
  };
}

export default async function LiveEventPage({ params }: PageProps) {
  const { username, eventId } = await params;
  
  // Verify profile exists and is public
  const profile = await getPublicProfileByUsername(username);
  if (!profile) {
    notFound();
  }

  // Get event
  const event = await getEvent(eventId);
  if (!event || event.userId !== profile.userId) {
    notFound();
  }

  // Get current user session
  const session = await auth() as any;
  const isEventHost = session?.userId === event.userId;

  // Increment view count (fire and forget)
  incrementViewerCount(eventId);

  const isLive = event.status === 'live';
  const isEnded = event.status === 'ended';

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href={`/athlete/${username}`} className="hover:text-orange-500">
            {profile.displayName || username}
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Video + Telemetry */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <LiveVideoPlayer
              streamUrl={event.streamUrl}
              thumbnailUrl={event.thumbnailUrl}
              title={event.title}
              isLive={isLive}
            />

            {/* Event Info */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {isLive && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-semibold text-white">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {isEnded && (
                      <span className="px-2 py-1 bg-zinc-700 rounded text-xs font-semibold text-zinc-300">
                        ENDED
                      </span>
                    )}
                    {event.eventType && (
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">
                        {event.eventType}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                  {event.description && (
                    <p className="text-zinc-400 mt-2">{event.description}</p>
                  )}
                </div>
                <div className="text-right text-sm text-zinc-500">
                  <p>{event.viewerCount || 0} viewers</p>
                  {event.actualStart && (
                    <p className="mt-1">
                      Started {new Date(event.actualStart).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Host info */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-zinc-800">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                    {(profile.displayName || username)[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <Link
                    href={`/athlete/${username}`}
                    className="font-medium text-white hover:text-orange-500 transition-colors"
                  >
                    {profile.displayName || username}
                  </Link>
                  {profile.tagline && (
                    <p className="text-sm text-zinc-500">{profile.tagline}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telemetry (if linked activity) */}
            {event.linkedActivityId && (
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Live Telemetry</h2>
                <LiveTelemetry
                  activityId={event.linkedActivityId}
                  refreshInterval={isLive ? 30000 : 0}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 h-[calc(100vh-8rem)]">
              <LiveChat
                eventId={eventId}
                currentUserId={session?.userId}
                isEventHost={isEventHost}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
