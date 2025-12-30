'use client';

import { useMemo } from 'react';

interface LiveVideoPlayerProps {
  streamUrl: string | null;
  thumbnailUrl?: string | null;
  title?: string;
  isLive?: boolean;
}

type Platform = 'youtube' | 'twitch' | 'vimeo' | 'unknown';

function detectPlatform(url: string): Platform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitch.tv')) return 'twitch';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'unknown';
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Handle youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }

  // Handle youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }

  // Handle youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return `https://www.youtube.com/embed/${embedMatch[1]}?autoplay=1&rel=0`;
  }

  // Handle youtube.com/live/VIDEO_ID
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) {
    return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&rel=0`;
  }

  return null;
}

function getTwitchEmbedUrl(url: string): string | null {
  // Handle twitch.tv/CHANNEL
  const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)$/);
  if (channelMatch) {
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${parent}&autoplay=true`;
  }

  // Handle twitch.tv/videos/VIDEO_ID
  const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (videoMatch) {
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${parent}&autoplay=true`;
  }

  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  // Handle vimeo.com/VIDEO_ID
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
  }
  return null;
}

function getEmbedUrl(url: string): string | null {
  const platform = detectPlatform(url);
  switch (platform) {
    case 'youtube':
      return getYouTubeEmbedUrl(url);
    case 'twitch':
      return getTwitchEmbedUrl(url);
    case 'vimeo':
      return getVimeoEmbedUrl(url);
    default:
      return null;
  }
}

export function LiveVideoPlayer({
  streamUrl,
  thumbnailUrl,
  title,
  isLive = false,
}: LiveVideoPlayerProps) {
  const embedUrl = useMemo(() => {
    if (!streamUrl) return null;
    return getEmbedUrl(streamUrl);
  }, [streamUrl]);

  // No stream URL - show placeholder
  if (!streamUrl) {
    return (
      <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title || 'Event thumbnail'}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/80 backdrop-blur flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">Stream Starting Soon</p>
          <p className="text-zinc-500 text-sm mt-1">Check back when the event goes live</p>
        </div>
      </div>
    );
  }

  // Invalid or unsupported URL
  if (!embedUrl) {
    return (
      <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex flex-col items-center justify-center">
        <p className="text-zinc-400 font-medium mb-2">Unable to embed stream</p>
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-400 text-sm underline"
        >
          Watch on external site →
        </a>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
      {/* Live badge */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-semibold">LIVE</span>
        </div>
      )}

      {/* Video iframe */}
      <iframe
        src={embedUrl}
        title={title || 'Live stream'}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
