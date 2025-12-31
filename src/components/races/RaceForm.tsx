'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRace, updateRace } from '@/app/actions/races';
import { Calendar, MapPin, Trophy, Flag, AlertCircle } from 'lucide-react';

interface RaceFormProps {
  initialData?: {
    id: string;
    name: string;
    date: Date;
    distance: number | null;
    distanceClass: string | null;
    location: string | null;
    goalTime: number | null;
    priority: 'A' | 'B' | 'C' | null;
    status: 'upcoming' | 'completed' | 'dns' | 'dnf';
    notes: string | null;
    raceUrl: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RaceForm({ initialData, onSuccess, onCancel }: RaceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '', // YYYY-MM-DD
    distanceClass: initialData?.distanceClass || '5K',
    location: initialData?.location || '',
    goalTimeStr: initialData?.goalTime ? formatDuration(initialData.goalTime) : '',
    priority: initialData?.priority || 'B',
    status: initialData?.status || 'upcoming',
    notes: initialData?.notes || '',
    raceUrl: initialData?.raceUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse Goal Time (HH:MM:SS) to seconds
      let goalTime: number | undefined = undefined;
      if (formData.goalTimeStr) {
        const parts = formData.goalTimeStr.split(':').map(Number);
        if (parts.length === 3) goalTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) goalTime = parts[0] * 60 + parts[1];
        else if (parts.length === 1) goalTime = parts[0] * 60; // assume minutes if just one number? or seconds? usually HH:MM:SS
      }

      const payload = {
        name: formData.name,
        date: new Date(formData.date).toISOString(),
        distanceClass: formData.distanceClass,
        location: formData.location || undefined,
        goalTime: goalTime,
        priority: formData.priority as 'A' | 'B' | 'C',
        status: formData.status as 'upcoming' | 'completed' | 'dns' | 'dnf',
        notes: formData.notes || undefined,
        raceUrl: formData.raceUrl || undefined,
      };

      if (initialData?.id) {
        await updateRace(initialData.id, payload);
      } else {
        await createRace(payload);
      }

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save race');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Race Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pl-9 text-white focus:outline-none focus:border-orange-500"
                placeholder="Boston Marathon"
              />
              <Flag className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pl-9 text-white focus:outline-none focus:border-orange-500 [&::-webkit-calendar-picker-indicator]:invert"
              />
              <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Distance & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Distance</label>
            <select
              value={formData.distanceClass}
              onChange={e => setFormData({ ...formData, distanceClass: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="5K">5K</option>
              <option value="10K">10K</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Marathon">Marathon</option>
              <option value="Ultra">Ultra</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Priority</label>
            <div className="flex bg-zinc-950 rounded border border-zinc-800 p-1">
              {(['A', 'B', 'C'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 text-sm font-bold py-1 rounded transition-colors ${
                    formData.priority === p 
                      ? p === 'A' ? 'bg-red-500 text-white' : p === 'B' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p} Race
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location & Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Location</label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pl-9 text-white focus:outline-none focus:border-orange-500"
                placeholder="City, State"
              />
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Goal Time (HH:MM:SS)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.goalTimeStr}
                onChange={e => setFormData({ ...formData, goalTimeStr: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pl-9 text-white focus:outline-none focus:border-orange-500 font-mono"
                placeholder="03:59:59"
              />
              <Trophy className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
        
        {/* Status */}
         <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="dns">DNS (Did Not Start)</option>
              <option value="dnf">DNF (Did Not Finish)</option>
            </select>
          </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Notes / Strategy</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500 h-24 resize-none"
            placeholder="Go out easy, push the hills..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 font-bold"
        >
          {loading ? 'Saving...' : initialData ? 'Update Race' : 'Create Race'}
        </button>
      </div>
    </form>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
