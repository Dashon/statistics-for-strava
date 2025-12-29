'use client';

import { useState, useRef } from 'react';
import { updateAthleteProfile, type AthleteProfileData } from '@/app/actions/profile';
import { getEffectiveDisplayName, getEffectiveProfilePicture, getEffectiveBio, getEffectiveLocation } from '@/app/actions/profile-utils';
import { uploadProfilePicture } from '@/app/actions/upload';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import { Camera, MapPin, Upload } from 'lucide-react';

interface ProfileFormProps {
  initialData: AthleteProfileData | null;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<AthleteProfileData>({
    displayName: initialData?.displayName,
    customProfilePicture: initialData?.customProfilePicture,
    bio: initialData?.bio,
    maxHeartRate: initialData?.maxHeartRate,
    restingHeartRate: initialData?.restingHeartRate,
    functionalThresholdPower: initialData?.functionalThresholdPower,
    weight: initialData?.weight,
    heightInCm: initialData?.heightInCm,
    dateOfBirth: initialData?.dateOfBirth,
    measurementUnit: initialData?.measurementUnit || 'metric',
  });

  const stravaName = `${initialData?.stravaFirstName || ''} ${initialData?.stravaLastName || ''}`.trim() || 'Not synced';
  const effectiveName = formData.displayName || stravaName || 'Athlete';
  const profilePicture = formData.customProfilePicture || initialData?.stravaProfilePicture || null;
  const effectiveBio = formData.bio || initialData?.stravaBio || '';
  const location = getEffectiveLocation(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateAthleteProfile(formData);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const { url } = await uploadProfilePicture(uploadData);
      setFormData(prev => ({ ...prev, customProfilePicture: url }));
      showToast('Profile picture uploaded!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (field: keyof AthleteProfileData, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleStringChange = (field: keyof AthleteProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value || undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Profile Identity Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h3 className="text-xl font-bold text-white mb-1 italic uppercase tracking-tight">IDENTITY</h3>
            <p className="text-sm text-zinc-500">Your profile information on QT.</p>
            </div>
            {location && (
            <div className="flex items-center gap-1.5 text-zinc-400 text-sm bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                <MapPin className="w-4 h-4 text-orange-500" />
                {location}
            </div>
            )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Picture Upload */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-zinc-900 flex items-center justify-center border-2 border-zinc-800 transition-all group-hover:border-orange-500/50 shadow-2xl">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt={effectiveName}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-zinc-700">
                  {effectiveName.charAt(0).toUpperCase()}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 bg-orange-600 hover:bg-orange-700 p-2.5 rounded-2xl text-white shadow-xl transition-transform active:scale-90"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Strava Identity
                </label>
                <div className="text-zinc-400 text-sm bg-zinc-900/50 rounded-xl px-4 py-3 border border-zinc-800 italic">
                    {stravaName}
                </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Display Name Override
                </label>
                <input
                    type="text"
                    value={formData.displayName ?? ''}
                    onChange={(e) => handleStringChange('displayName', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder={stravaName}
                />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                About Yourself (Bio)
              </label>
              <textarea
                value={formData.bio ?? ''}
                onChange={(e) => handleStringChange('bio', e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                placeholder={initialData?.stravaBio || "Tell us about your running journey..."}
              />
              <p className="mt-2 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                {formData.bio ? 'Custom Bio Active' : 'Synced from Strava'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* Performance Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 italic uppercase tracking-tight">PERFORMANCE</h3>
          <p className="text-sm text-zinc-500">Essential metrics for AI analysis.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Max HR (BPM)
            </label>
            <input
              type="number"
              value={formData.maxHeartRate ?? ''}
              onChange={(e) => handleChange('maxHeartRate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="180"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Resting HR (BPM)
            </label>
            <input
              type="number"
              value={formData.restingHeartRate ?? ''}
              onChange={(e) => handleChange('restingHeartRate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              FTP (WATTS)
            </label>
            <input
              type="number"
              value={formData.functionalThresholdPower ?? ''}
              onChange={(e) => handleChange('functionalThresholdPower', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="250"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Weight (KG)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight ?? ''}
              onChange={(e) => handleChange('weight', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder={initialData?.stravaWeight?.toString() || "70"}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Height (CM)
            </label>
            <input
              type="number"
              value={formData.heightInCm ?? ''}
              onChange={(e) => handleChange('heightInCm', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder={initialData?.stravaHeight?.toString() || "175"}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Birth Date
            </label>
            <input
              type="date"
              value={formData.dateOfBirth ?? ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Units
            </label>
            <select
              value={formData.measurementUnit ?? 'metric'}
              onChange={(e) => handleStringChange('measurementUnit', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="metric">Metric (KM)</option>
              <option value="imperial">Imperial (MI)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-900">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic px-8 py-3 rounded-xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          {saving ? 'UPDATING...' : 'SAVE CHANGES'}
        </button>
      </div>
    </form>
  );
}
