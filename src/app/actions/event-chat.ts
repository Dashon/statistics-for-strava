'use server';

import { db } from '@/db';
import { eventChat, liveEvent, athleteProfile } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, asc } from 'drizzle-orm';


export type ChatMessage = {
  messageId: string;
  eventId: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  isDeleted: boolean | null;
  createdAt: string;
};

// Send a chat message
export async function sendEventChatMessage(
  eventId: string,
  content: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate content
  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 500) {
    return { success: false, error: 'Message must be 1-500 characters' };
  }

  try {
    // Get user's profile for display name and avatar
    const profiles = await db
      .select({
        displayName: athleteProfile.displayName,
        firstName: athleteProfile.stravaFirstName,
        lastName: athleteProfile.stravaLastName,
        avatar: athleteProfile.stravaProfilePicture,
      })
      .from(athleteProfile)
      .where(eq(athleteProfile.userId, session.userId))
      .limit(1);

    const profile = profiles[0];
    const userName = profile?.displayName || 
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
      'Anonymous';
    const userAvatar = profile?.avatar || null;

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(eventChat).values({
      messageId,
      eventId,
      userId: session.userId,
      userName,
      userAvatar,
      content: trimmedContent,
      isDeleted: false,
      createdAt: now,
    });

    const message: ChatMessage = {
      messageId,
      eventId,
      userId: session.userId,
      userName,
      userAvatar,
      content: trimmedContent,
      isDeleted: false,
      createdAt: now,
    };

    return { success: true, message };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

// Get chat messages for an event (for initial load)
export async function getEventChatMessages(
  eventId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const messages = await db
    .select()
    .from(eventChat)
    .where(and(
      eq(eventChat.eventId, eventId),
      eq(eventChat.isDeleted, false)
    ))
    .orderBy(desc(eventChat.createdAt))
    .limit(limit);

  // Reverse to show oldest first
  return messages.reverse();
}

// Delete a chat message (owner or event host only)
export async function deleteEventChatMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get the message to check ownership
    const messages = await db
      .select({
        userId: eventChat.userId,
        eventId: eventChat.eventId,
      })
      .from(eventChat)
      .where(eq(eventChat.messageId, messageId))
      .limit(1);

    if (!messages[0]) {
      return { success: false, error: 'Message not found' };
    }

    const message = messages[0];

    // Check if user is message owner or event host
    const isMessageOwner = message.userId === session.userId;
    
    // Check if user is the event host
    const events = await db
      .select({ userId: liveEvent.userId })
      .from(liveEvent)
      .where(eq(liveEvent.eventId, message.eventId))
      .limit(1);

    const isEventHost = events[0]?.userId === session.userId;

    if (!isMessageOwner && !isEventHost) {
      return { success: false, error: 'Not authorized to delete this message' };
    }

    // Soft delete - mark as deleted
    await db
      .update(eventChat)
      .set({ isDeleted: true })
      .where(eq(eventChat.messageId, messageId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}
