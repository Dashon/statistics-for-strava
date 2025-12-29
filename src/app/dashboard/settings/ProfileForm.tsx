'use client';

import { useState } from 'react';
import { updateAthleteProfile, type AthleteProfileData } from '@/app/actions/profile';
import { useToast } from '@/components/Toast';

interface ProfileFormProps {
  initialData: AthleteProfileData | null;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AthleteProfileData>({
    maxHeartRate: initialData?.maxHeartRate,
    restingHeartRate: initialData?.restingHeartRate,
    functionalThresholdPower: initialData?.functionalThresholdPower,
    weight: initialData?.weight,
    heightInCm: initialData?.heightInCm,
    dateOfBirth: initialData?.dateOfBirth,
  });

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

  const handleChange = (field: keyof AthleteProfileData, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value || undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Max Heart Rate (bpm)
          </label>
          <input
            type="number"
            value={formData.maxHeartRate ?? ''}
            onChange={(e) => handleChange('maxHeartRate', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="180"
          />
          <p className="mt-1 text-xs text-zinc-500">Used for heart rate zone calculations</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Resting Heart Rate (bpm)
          </label>
          <input
            type="number"
            value={formData.restingHeartRate ?? ''}
            onChange={(e) => handleChange('restingHeartRate', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="60"
          />
          <p className="mt-1 text-xs text-zinc-500">Your typical resting heart rate</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            FTP (watts)
          </label>
          <input
            type="number"
            value={formData.functionalThresholdPower ?? ''}
            onChange={(e) => handleChange('functionalThresholdPower', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="250"
          />
          <p className="mt-1 text-xs text-zinc-500">Functional Threshold Power for cycling</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.weight ?? ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="70"
          />
          <p className="mt-1 text-xs text-zinc-500">Used for power-to-weight calculations</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            value={formData.heightInCm ?? ''}
            onChange={(e) => handleChange('heightInCm', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="175"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth ?? ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
