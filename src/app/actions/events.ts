'use server';

import { db } from '@/db';
import { liveEvent, broadcastArchive } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, or, sql, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';


export type EventStatus = 'scheduled' | 'live' | 'ended';
export type EventType = 'marathon' | 'ultra' | 'training' | 'podcast' | 'race' | 'other';

export type LiveEventData = {
  eventId: string;
  userId: string;
  title: string;
  description: string | null;
  eventType: string | null;
  status: string | null;
  scheduledStart: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  linkedActivityId: string | null;
  viewerCount: number | null;
  createdAt: string;
};

export type BroadcastArchiveData = {
  archiveId: string;
  eventId: string | null;
  userId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  linkedActivityId: string | null;
  createdAt: string;
};

// Create a new event
export async function createEvent(data: {
  title: string;
  description?: string;
  eventType?: EventType;
  scheduledStart?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  linkedActivityId?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(liveEvent).values({
      eventId,
      userId: session.userId,
      title: data.title,
      description: data.description || null,
      eventType: data.eventType || 'other',
      status: 'scheduled',
      scheduledStart: data.scheduledStart || null,
      streamUrl: data.streamUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      linkedActivityId: data.linkedActivityId || null,
      viewerCount: 0,
      createdAt: now,
    });

    revalidatePath('/dashboard/events');
    return { success: true, eventId };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

// Update event status (go live, end event)
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const now = new Date().toISOString();
    const updates: Record<string, any> = { status };

    if (status === 'live') {
      updates.actualStart = now;
    } else if (status === 'ended') {
      updates.actualEnd = now;
    }

    await db
      .update(liveEvent)
      .set(updates)
      .where(and(
        eq(liveEvent.eventId, eventId),
        eq(liveEvent.userId, session.userId)
      ));

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error updating event status:', error);
    return { success: false, error: 'Failed to update event status' };
  }
}

// Update event details
export async function updateEvent(
  eventId: string,
  data: {
    title?: string;
    description?: string;
    eventType?: EventType;
    scheduledStart?: string;
    streamUrl?: string;
    thumbnailUrl?: string;
    linkedActivityId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await db
      .update(liveEvent)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.eventType !== undefined && { eventType: data.eventType }),
        ...(data.scheduledStart !== undefined && { scheduledStart: data.scheduledStart }),
        ...(data.streamUrl !== undefined && { streamUrl: data.streamUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.linkedActivityId !== undefined && { linkedActivityId: data.linkedActivityId }),
      })
      .where(and(
        eq(liveEvent.eventId, eventId),
        eq(liveEvent.userId, session.userId)
      ));

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Failed to update event' };
  }
}

// Delete event
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await db
      .delete(liveEvent)
      .where(and(
        eq(liveEvent.eventId, eventId),
        eq(liveEvent.userId, session.userId)
      ));

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Failed to delete event' };
  }
}

// Get my events
export async function getMyEvents(): Promise<LiveEventData[]> {
  const session = await auth() as any;
  if (!session?.userId) {
    return [];
  }

  const events = await db
    .select()
    .from(liveEvent)
    .where(eq(liveEvent.userId, session.userId))
    .orderBy(desc(liveEvent.createdAt));

  return events;
}

// Get upcoming events for a user (public)
export async function getUpcomingEvents(userId: string): Promise<LiveEventData[]> {
  const events = await db
    .select()
    .from(liveEvent)
    .where(and(
      eq(liveEvent.userId, userId),
      or(
        eq(liveEvent.status, 'scheduled'),
        eq(liveEvent.status, 'live')
      )
    ))
    .orderBy(asc(liveEvent.scheduledStart))
    .limit(5);

  return events;
}

// Get a single event by ID
export async function getEvent(eventId: string): Promise<LiveEventData | null> {
  const events = await db
    .select()
    .from(liveEvent)
    .where(eq(liveEvent.eventId, eventId))
    .limit(1);

  return events[0] || null;
}

// Increment viewer count
export async function incrementViewerCount(eventId: string): Promise<void> {
  await db
    .update(liveEvent)
    .set({
      viewerCount: sql`${liveEvent.viewerCount} + 1`,
    })
    .where(eq(liveEvent.eventId, eventId));
}

// ==================== BROADCAST ARCHIVE ====================

// Add broadcast archive
export async function addBroadcastArchive(data: {
  eventId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  linkedActivityId?: string;
}): Promise<{ success: boolean; archiveId?: string; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const archiveId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(broadcastArchive).values({
      archiveId,
      eventId: data.eventId || null,
      userId: session.userId,
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      durationSeconds: data.durationSeconds || null,
      linkedActivityId: data.linkedActivityId || null,
      viewCount: 0,
      createdAt: now,
    });

    revalidatePath('/dashboard/events');
    return { success: true, archiveId };
  } catch (error) {
    console.error('Error adding broadcast archive:', error);
    return { success: false, error: 'Failed to add broadcast archive' };
  }
}

// Get broadcasts for a user (public)
export async function getBroadcasts(userId: string, limit = 10): Promise<BroadcastArchiveData[]> {
  const broadcasts = await db
    .select()
    .from(broadcastArchive)
    .where(eq(broadcastArchive.userId, userId))
    .orderBy(desc(broadcastArchive.createdAt))
    .limit(limit);

  return broadcasts;
}

// Increment view count for a broadcast
export async function incrementBroadcastViewCount(archiveId: string): Promise<void> {
  await db
    .update(broadcastArchive)
    .set({
      viewCount: sql`${broadcastArchive.viewCount} + 1`,
    })
    .where(eq(broadcastArchive.archiveId, archiveId));
}

// Delete broadcast archive
export async function deleteBroadcastArchive(archiveId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await db
      .delete(broadcastArchive)
      .where(and(
        eq(broadcastArchive.archiveId, archiveId),
        eq(broadcastArchive.userId, session.userId)
      ));

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting broadcast archive:', error);
    return { success: false, error: 'Failed to delete broadcast' };
  }
}
