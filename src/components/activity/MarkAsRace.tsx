'use client';

import { useState } from 'react';
import { Flag, Trophy, Medal, Save, X } from 'lucide-react';
import { markActivityAsRace, unmarkActivityAsRace } from '@/app/actions/races';
import { useRouter } from 'next/navigation';

interface MarkAsRaceProps {
  activityId: string;
  isRace: boolean;
  initialData?: {
    raceName?: string | null;
    distanceClass?: string | null;
    officialTime?: number | null;
    placement?: number | null;
    isPr?: boolean | null;
  };
}

export function MarkAsRace({ activityId, isRace, initialData }: MarkAsRaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    raceName: initialData?.raceName || '',
    distanceClass: initialData?.distanceClass || '5k',
    officialTime: initialData?.officialTime || 0,
    placement: initialData?.placement || 0,
    isPr: initialData?.isPr || false,
  });

  const handleToggle = async () => {
    if (isRace) {
      if (confirm('Are you sure you want to unmark this activity as a race?')) {
        setLoading(true);
        try {
          await unmarkActivityAsRace(activityId);
          router.refresh();
        } catch (error) {
          console.error(error);
          alert('Failed to unmark race');
        } finally {
          setLoading(false);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await markActivityAsRace(activityId, {
        raceName: formData.raceName,
        raceDistanceClass: formData.distanceClass,
        officialTime: formData.officialTime > 0 ? formData.officialTime : undefined,
        placement: formData.placement > 0 ? formData.placement : undefined,
        isPr: formData.isPr,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to save race details');
    } finally {
      setLoading(false);
    }
  };

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Mark as Race
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Race Name</label>
              <input
                type="text"
                required
                value={formData.raceName}
                onChange={e => setFormData({ ...formData, raceName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. Boston Marathon 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Distance Class</label>
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
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Placement (Optional)</label>
                <input
                  type="number"
                  value={formData.placement || ''}
                  onChange={e => setFormData({ ...formData, placement: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Overall rank"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isPr"
                checked={formData.isPr}
                onChange={e => setFormData({ ...formData, isPr: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="isPr" className="text-sm text-white font-medium cursor-pointer">
                This was a Personal Record (PR)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-500 font-bold flex items-center justify-center gap-2"
              >
                {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Race</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors
        ${isRace 
          ? 'bg-orange-500/10 text-orange-500 border border-orange-500/50 hover:bg-orange-500/20' 
          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
        }
      `}
    >
      {loading ? (
        <span className="opacity-50">Updating...</span>
      ) : isRace ? (
        <>
          <Trophy className="w-3.5 h-3.5" />
          Race
        </>
      ) : (
        <>
          <Flag className="w-3.5 h-3.5" />
          Mark as Race
        </>
      )}
    </button>
  );
}
