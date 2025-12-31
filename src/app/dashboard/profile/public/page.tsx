'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyPublicProfile,
  updatePublicProfile,
  checkUsernameAvailable,
  type SocialLinks,
} from '@/app/actions/public-profile';

export default function PublicProfileEditorPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [initialUsername, setInitialUsername] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    tagline: '',
    coverImageUrl: '',
    isPublic: false,
    socialLinks: {
      instagram: '',
      twitter: '',
      strava: '',
      youtube: '',
    } as SocialLinks,
  });

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      const profile = await getMyPublicProfile();
      if (profile) {
        setFormData({
          username: profile.username || '',
          displayName: profile.displayName || '',
          tagline: profile.tagline || '',
          coverImageUrl: profile.coverImageUrl || '',
          isPublic: profile.isPublic || false,
          socialLinks: (profile.socialLinks as SocialLinks) || {
            instagram: '',
            twitter: '',
            strava: '',
            youtube: '',
          },
        });
        setInitialUsername(profile.username || '');
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  // Check username availability
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      if (formData.username === initialUsername) {
        setUsernameStatus('available');
        return;
      }
      setUsernameStatus('checking');
      const result = await checkUsernameAvailable(formData.username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePublicProfile({
        username: formData.username || undefined,
        displayName: formData.displayName || undefined,
        tagline: formData.tagline || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        isPublic: formData.isPublic,
        socialLinks: formData.socialLinks,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-32 bg-zinc-800 rounded-xl" />
          <div className="h-12 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Public Profile</h1>
      <p className="text-zinc-400 mb-8">
        Customize your public athlete profile. Share your running journey with fans and followers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Visibility Toggle */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Profile Visibility</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Make your profile public so others can find and follow you
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isPublic ? 'bg-orange-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  formData.isPublic ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              qt.run/athlete/
            </span>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))
              }
              placeholder="your-username"
              className="w-full pl-32 pr-12 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              )}
              {usernameStatus === 'available' && (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {usernameStatus === 'taken' && (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            3-30 characters, lowercase letters, numbers, and underscores only
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Your Name"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
            placeholder="Ultra Runner | 100-mile finisher"
            maxLength={100}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Cover Image URL
          </label>
          <input
            type="url"
            value={formData.coverImageUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
            placeholder="https://example.com/cover.jpg"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {formData.coverImageUrl && (
            <div className="mt-3 h-32 rounded-lg overflow-hidden">
              <img
                src={formData.coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-4">
            Social Links
          </label>
          <div className="space-y-3">
            {[
              { key: 'instagram' as const, label: 'Instagram', prefix: 'instagram.com/' },
              { key: 'twitter' as const, label: 'X (Twitter)', prefix: 'x.com/' },
              { key: 'strava' as const, label: 'Strava', prefix: 'strava.com/athletes/' },
              { key: 'youtube' as const, label: 'YouTube', prefix: 'youtube.com/' },
            ].map((social) => (
              <div key={social.key} className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  {social.prefix}
                </span>
                <input
                  type="text"
                  value={formData.socialLinks[social.key] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [social.key]: e.target.value },
                    }))
                  }
                  placeholder={social.label}
                  className="w-full pl-40 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Profile updated successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending || usernameStatus === 'taken'}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Profile'}
          </button>
          {formData.isPublic && formData.username && (
            <a
              href={`/athlete/${formData.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400"
            >
              View Public Profile →
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
