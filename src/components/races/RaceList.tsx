'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Trophy, MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { deleteRace } from '@/app/actions/races';
import { useRouter } from 'next/navigation';

interface Race {
  id: string;
  name: string;
  date: Date | string;
  distanceClass: string | null;
  location: string | null;
  priority: string | null;
  status: string;
  resultTime: number | null;
  goalTime: number | null;
}

interface RaceListProps {
  races: Race[];
  onEdit: (race: Race) => void;
}

// Helper to format duration
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

export function RaceList({ races, onEdit }: RaceListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this race?')) {
      setDeletingId(id);
      try {
        await deleteRace(id);
        router.refresh();
      } catch (error) {
        console.error(error);
        alert('Failed to delete race');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (races.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 rounded-xl border border-zinc-800 text-zinc-500">
        <Trophy className="w-8 h-8 mb-4 opacity-50" />
        <p>No races found. Create your first race!</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-black/20 text-zinc-500 border-b border-zinc-800 uppercase text-xs tracking-wider font-bold">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Goal/Result</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {races.map((race) => {
              const isUpcoming = race.status === 'upcoming';
              const dateObj = new Date(race.date);
              
              return (
                <tr key={race.id} className="group hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">
                        {format(dateObj, 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {isUpcoming ? getDaysUntil(dateObj) : race.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{race.name}</span>
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded w-fit mt-1">
                        {race.distanceClass}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {race.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {race.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                     {race.priority && (
                        <span className={`
                           inline-flex items-center px-2 py-0.5 rounded text-xs font-bold
                           ${race.priority === 'A' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                             race.priority === 'B' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                             'bg-green-500/10 text-green-500 border border-green-500/20'}
                        `}>
                           {race.priority} Race
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    {race.resultTime ? (
                       <span className="text-white font-bold">{formatDuration(race.resultTime)}</span>
                    ) : race.goalTime ? (
                       <span className="text-zinc-500">{formatDuration(race.goalTime)} (Goal)</span>
                    ) : (
                       <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(race)}
                        className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Edit Race"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(race.id)}
                        disabled={deletingId === race.id}
                        className="p-1.5 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete Race"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDaysUntil(date: Date) {
  const diff = date.getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Completed';
  if (days === 0) return 'Today!';
  return `In ${days} days`;
}
