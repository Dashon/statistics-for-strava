import Link from 'next/link';
import type { PublicProfileWithStats, SocialLinks } from '@/app/actions/public-profile';

interface PublicProfileHeaderProps {
  profile: PublicProfileWithStats;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 1000) return `${(km / 1000).toFixed(1)}K km`;
  return `${Math.round(km)} km`;
}

const socialIcons: Record<keyof SocialLinks, React.ReactNode> = {
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  strava: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

export function PublicProfileHeader({ profile }: PublicProfileHeaderProps) {
  const socialLinks = profile.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-orange-900/30 to-zinc-900 rounded-xl overflow-hidden">
        {profile.coverImageUrl && (
          <img
            src={profile.coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 md:px-8 pb-6">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || 'Athlete'}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-zinc-900 object-cover"
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-zinc-900 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-4xl font-bold">
                {(profile.displayName || 'A')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and tagline */}
          <div className="flex-1 pb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {profile.displayName || profile.username}
            </h1>
            {profile.tagline && (
              <p className="text-zinc-400 mt-1">{profile.tagline}</p>
            )}
            
            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-3">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-orange-500 transition-colors"
                      aria-label={platform}
                    >
                      {socialIcons[platform as keyof SocialLinks]}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 md:gap-8 pb-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatNumber(profile.totalActivities)}
              </p>
              <p className="text-xs text-zinc-500 uppercase">Activities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatDistance(profile.totalDistance)}
              </p>
              <p className="text-xs text-zinc-500 uppercase">Distance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatNumber(Math.round(profile.totalElevation))}m
              </p>
              <p className="text-xs text-zinc-500 uppercase">Elevation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
