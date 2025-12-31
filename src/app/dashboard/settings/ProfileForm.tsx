'use client';

import { useState, useRef, useEffect } from 'react';
import { updateAthleteProfile, type AthleteProfileData } from '@/app/actions/profile';
import { getEffectiveDisplayName, getEffectiveProfilePicture, getEffectiveBio, getEffectiveLocation } from '@/app/actions/profile-utils';
import { uploadProfilePicture } from '@/app/actions/upload';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import { Camera, MapPin, Upload, Sparkles, X } from 'lucide-react';

interface ProfileFormProps {
  initialData: AthleteProfileData | null;
}

interface ReferenceImage {
  imageId: string;
  imageUrl: string;
  imageType: string;
  isDefault: boolean;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
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
    measurementUnit: initialData?.measurementUnit || 'imperial',
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

  // Load reference images on mount
  useEffect(() => {
    loadReferenceImages();
  }, []);

  const loadReferenceImages = async () => {
    try {
      const res = await fetch('/api/reference-image');
      const data = await res.json();
      if (data.images) {
        setReferenceImages(data.images);
      }
    } catch (error) {
      console.error('Failed to load reference images:', error);
    }
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReference(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('imageType', imageType);
    uploadData.append('isDefault', referenceImages.length === 0 ? 'true' : 'false');

    try {
      const res = await fetch('/api/reference-image', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');

      showToast('Reference image uploaded successfully!', 'success');
      await loadReferenceImages();
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploadingReference(false);
    }
  };

  const handleDeleteReferenceImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/reference-image?imageId=${imageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      showToast('Reference image deleted', 'success');
      await loadReferenceImages();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Delete failed. Please try again.', 'error');
    }
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
                <MapPin className="w-4 h-4 text-cyan-500" />
                {location}
            </div>
            )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Picture Upload */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-zinc-900 flex items-center justify-center border-2 border-zinc-800 transition-all group-hover:border-cyan-500/50 shadow-2xl">
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
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 bg-cyan-600 hover:bg-cyan-700 p-2.5 rounded-2xl text-white shadow-xl transition-transform active:scale-90"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
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
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Units
            </label>
            <select
              value={formData.measurementUnit ?? 'metric'}
              onChange={(e) => handleStringChange('measurementUnit', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 appearance-none cursor-pointer"
            >
              <option value="metric">Metric (KM)</option>
              <option value="imperial">Imperial (MI)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* AI Thumbnail Reference Images Section */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <h3 className="text-xl font-bold text-white italic uppercase tracking-tight">AI THUMBNAILS</h3>
          </div>
          <p className="text-sm text-zinc-500">Upload reference photos for AI-generated run thumbnails.</p>
        </div>

        {referenceImages.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 mb-4">No reference images uploaded yet.</p>
            <p className="text-sm text-zinc-600 mb-6">
              Upload a photo of yourself running or cycling. The AI will use this to generate
              custom thumbnails showing you at your activity locations.
            </p>
            <button
              type="button"
              onClick={() => referenceImageInputRef.current?.click()}
              disabled={uploadingReference}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {uploadingReference ? 'UPLOADING...' : 'UPLOAD REFERENCE IMAGE'}
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {referenceImages.map((img) => (
                <div key={img.imageId} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 group-hover:border-cyan-500/50 transition-all">
                    <Image
                      src={img.imageUrl}
                      alt={`Reference ${img.imageType}`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteReferenceImage(img.imageId)}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase">{img.imageType}</span>
                    {img.isDefault && (
                      <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded-full font-bold">
                        DEFAULT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => referenceImageInputRef.current?.click()}
              disabled={uploadingReference}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {uploadingReference ? 'UPLOADING...' : 'ADD ANOTHER IMAGE'}
            </button>
          </div>
        )}

        <input
          type="file"
          ref={referenceImageInputRef}
          onChange={(e) => handleReferenceImageUpload(e, 'running')}
          className="hidden"
          accept="image/*"
        />

        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-cyan-500">Tip:</strong> Upload clear photos of yourself in athletic gear.
            The AI will use these to generate realistic thumbnails of you running at your activity locations,
            using lat/long data from your Strava activities.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-900">
        <button
          type="submit"
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic px-8 py-3 rounded-xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          {saving ? 'UPDATING...' : 'SAVE CHANGES'}
        </button>
      </div>
    </form>
  );
}
