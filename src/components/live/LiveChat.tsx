'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sendEventChatMessage, getEventChatMessages, deleteEventChatMessage, type ChatMessage } from '@/app/actions/event-chat';

// Initialize Supabase client for realtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface LiveChatProps {
  eventId: string;
  currentUserId?: string;
  isEventHost?: boolean;
}

export function LiveChat({ eventId, currentUserId, isEventHost = false }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const initialMessages = await getEventChatMessages(eventId);
        setMessages(initialMessages);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load chat');
        setIsLoading(false);
      }
    }
    loadMessages();
  }, [eventId, scrollToBottom]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not configured');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`event_chat:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_chat',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg.is_deleted) {
            const formattedMsg: ChatMessage = {
              messageId: newMsg.message_id,
              eventId: newMsg.event_id,
              userId: newMsg.user_id,
              userName: newMsg.user_name,
              userAvatar: newMsg.user_avatar,
              content: newMsg.content,
              isDeleted: newMsg.is_deleted,
              createdAt: newMsg.created_at,
            };
            setMessages((prev) => [...prev, formattedMsg]);
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_chat',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          if (updatedMsg.is_deleted) {
            setMessages((prev) =>
              prev.filter((m) => m.messageId !== updatedMsg.message_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, scrollToBottom]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !currentUserId) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await sendEventChatMessage(eventId, newMessage);
      if (result.success) {
        setNewMessage('');
        inputRef.current?.focus();
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await deleteEventChatMessage(messageId);
      if (!result.success) {
        setError(result.error || 'Failed to delete message');
      }
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  // Format timestamp
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="font-semibold text-white">Live Chat</h3>
        </div>
        <span className="text-xs text-zinc-500">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`group flex gap-3 ${
                msg.userId === currentUserId ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {msg.userAvatar ? (
                  <img
                    src={msg.userAvatar}
                    alt={msg.userName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-medium">
                    {(msg.userName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message */}
              <div
                className={`flex-1 max-w-[80%] ${
                  msg.userId === currentUserId ? 'text-right' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-300">
                    {msg.userName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <div
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    msg.userId === currentUserId
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Delete button for own messages or if host */}
                {(msg.userId === currentUserId || isEventHost) && (
                  <button
                    onClick={() => handleDeleteMessage(msg.messageId)}
                    className="opacity-0 group-hover:opacity-100 ml-2 text-xs text-zinc-500 hover:text-red-500 transition-opacity"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      {currentUserId ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors"
            >
              {isSending ? (
                <span className="animate-spin">↻</span>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            <a href="/api/auth/signin" className="text-orange-500 hover:underline">
              Sign in
            </a>{' '}
            to join the chat
          </p>
        </div>
      )}
    </div>
  );
}
