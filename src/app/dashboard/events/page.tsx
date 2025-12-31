'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getMyEvents,
  createEvent,
  updateEventStatus,
  deleteEvent,
  addBroadcastArchive,
  type LiveEventData,
  type EventType,
} from '@/app/actions/events';
import { getMyPublicProfile } from '@/app/actions/public-profile';

export default function EventManagementPage() {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<LiveEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Create event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventType: 'other' as EventType,
    scheduledStart: '',
    streamUrl: '',
  });

  // Archive form
  const [archiveData, setArchiveData] = useState({
    videoUrl: '',
    title: '',
  });

  // Load events and profile
  useEffect(() => {
    async function load() {
      const [eventsData, profile] = await Promise.all([
        getMyEvents(),
        getMyPublicProfile(),
      ]);
      setEvents(eventsData);
      setUsername(profile?.username || null);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createEvent({
        title: newEvent.title,
        description: newEvent.description || undefined,
        eventType: newEvent.eventType,
        scheduledStart: newEvent.scheduledStart || undefined,
        streamUrl: newEvent.streamUrl || undefined,
      });

      if (result.success) {
        setShowCreateModal(false);
        setNewEvent({ title: '', description: '', eventType: 'other', scheduledStart: '', streamUrl: '' });
        const updatedEvents = await getMyEvents();
        setEvents(updatedEvents);
      } else {
        setError(result.error || 'Failed to create event');
      }
    });
  };

  const handleStatusChange = async (eventId: string, status: 'live' | 'ended') => {
    startTransition(async () => {
      const result = await updateEventStatus(eventId, status);
      if (result.success) {
        const updatedEvents = await getMyEvents();
        setEvents(updatedEvents);
      }
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
      }
    });
  };

  const handleAddArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showArchiveModal) return;

    const event = events.find((e) => e.eventId === showArchiveModal);
    if (!event) return;

    startTransition(async () => {
      const result = await addBroadcastArchive({
        eventId: showArchiveModal,
        videoUrl: archiveData.videoUrl,
        title: archiveData.title || event.title,
      });

      if (result.success) {
        setShowArchiveModal(null);
        setArchiveData({ videoUrl: '', title: '' });
      }
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-32 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Events</h1>
          <p className="text-zinc-400 mt-1">Schedule and manage your live broadcasts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
        >
          + New Event
        </button>
      </div>

      {/* No public profile warning */}
      {!username && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400">
            <strong>Set up your public profile first!</strong> You need a public profile username
            before your events can be viewed by others.
          </p>
          <Link
            href="/dashboard/profile/public"
            className="text-cyan-500 hover:underline text-sm mt-2 inline-block"
          >
            Set up public profile →
          </Link>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/30 rounded-xl border border-zinc-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">No events yet</p>
          <p className="text-zinc-500 text-sm mt-1">Create your first live event to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {event.status === 'live' && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-semibold text-white">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {event.status === 'scheduled' && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold">
                        SCHEDULED
                      </span>
                    )}
                    {event.status === 'ended' && (
                      <span className="px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs font-semibold">
                        ENDED
                      </span>
                    )}
                    {event.eventType && (
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-500 rounded text-xs capitalize">
                        {event.eventType}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  {event.description && (
                    <p className="text-zinc-500 text-sm mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                    <span>📅 {formatDate(event.scheduledStart)}</span>
                    {event.viewerCount !== null && event.viewerCount > 0 && (
                      <span>👁 {event.viewerCount} viewers</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {event.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(event.eventId, 'live')}
                      disabled={isPending}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Go Live
                    </button>
                  )}
                  {event.status === 'live' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(event.eventId, 'ended')}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded transition-colors"
                      >
                        End Stream
                      </button>
                      {username && (
                        <Link
                          href={`/athlete/${username}/live/${event.eventId}`}
                          target="_blank"
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          View →
                        </Link>
                      )}
                    </>
                  )}
                  {event.status === 'ended' && (
                    <button
                      onClick={() => {
                        setArchiveData({ videoUrl: '', title: event.title });
                        setShowArchiveModal(event.eventId);
                      }}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded transition-colors"
                    >
                      Add Recording
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(event.eventId)}
                    disabled={isPending}
                    className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                    title="Delete event"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Event Type</label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, eventType: e.target.value as EventType }))}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="marathon">Marathon</option>
                    <option value="ultra">Ultra</option>
                    <option value="race">Race</option>
                    <option value="training">Training</option>
                    <option value="podcast">Podcast</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    value={newEvent.scheduledStart}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, scheduledStart: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Stream URL</label>
                <input
                  type="url"
                  value={newEvent.streamUrl}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, streamUrl: e.target.value }))}
                  placeholder="https://youtube.com/live/..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-zinc-500 mt-1">YouTube, Twitch, or Vimeo URL</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newEvent.title}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
                >
                  {isPending ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Add Recording</h2>
            <form onSubmit={handleAddArchive} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={archiveData.title}
                  onChange={(e) => setArchiveData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Video URL *</label>
                <input
                  type="url"
                  value={archiveData.videoUrl}
                  onChange={(e) => setArchiveData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !archiveData.videoUrl}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
                >
                  {isPending ? 'Saving...' : 'Save Recording'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
