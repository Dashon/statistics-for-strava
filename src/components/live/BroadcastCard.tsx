import Link from 'next/link';
import type { BroadcastArchiveData } from '@/app/actions/events';

interface BroadcastCardProps {
  broadcast: BroadcastArchiveData;
  username: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatViewCount(count: number | null): string {
  if (!count) return '0 views';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function BroadcastCard({ broadcast, username }: BroadcastCardProps) {
  return (
    <Link
      href={`/athlete/${username}/broadcast/${broadcast.archiveId}`}
      className="group block bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-orange-500/50 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-800">
        {broadcast.thumbnailUrl ? (
          <img
            src={broadcast.thumbnailUrl}
            alt={broadcast.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <svg
              className="w-12 h-12 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        {broadcast.durationSeconds && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white font-medium">
            {formatDuration(broadcast.durationSeconds)}
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
          {broadcast.title}
        </h3>
        {broadcast.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
            {broadcast.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
          <span>{formatViewCount(broadcast.viewCount)}</span>
          <span>•</span>
          <span>{formatDate(broadcast.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
