'use client';

import { UpcomingRace } from "@/app/actions/modular-profile";
import { Calendar, MapPin, Target, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NextRaceProps {
  race: UpcomingRace | null;
  upcomingRaces: UpcomingRace[];
}

function formatGoalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`;
  return `${m} min`;
}

function getCountdown(targetDate: string): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'A': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'B': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    case 'C': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
  }
}

export function NextRace({ race, upcomingRaces }: NextRaceProps) {
  const [countdown, setCountdown] = useState(race ? getCountdown(race.date) : null);

  useEffect(() => {
    if (!race) return;
    
    const interval = setInterval(() => {
      setCountdown(getCountdown(race.date));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [race]);

  if (!race) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 h-full flex flex-col items-center justify-center text-center"
      >
        <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="text-zinc-400 font-bold mb-2">No Upcoming Races</h3>
        <p className="text-zinc-500 text-sm">Check back later for race schedule</p>
      </motion.div>
    );
  }

  const raceDate = new Date(race.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-900 rounded-xl border border-orange-500/20 overflow-hidden h-full flex flex-col"
    >
      {/* Header with Priority Badge */}
      <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Next Race</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getPriorityColor(race.priority)}`}>
          {race.priority === 'A' ? 'Goal Race' : race.priority === 'B' ? 'Key Race' : 'Tune-up'}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Race Name */}
        <h3 className="text-2xl font-black text-white mb-2 leading-tight">
          {race.name}
        </h3>

        {/* Location & Distance */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          {race.location && (
            <div className="flex items-center gap-1 text-zinc-400">
              <MapPin className="w-3 h-3" />
              <span>{race.location}</span>
            </div>
          )}
          {race.distanceClass && (
            <div className="flex items-center gap-1 text-orange-400 font-bold">
              <span>{race.distanceClass}</span>
            </div>
          )}
        </div>

        {/* Countdown */}
        {countdown && (
          <div className="flex gap-3 mb-4">
            <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center min-w-[60px] border border-zinc-700">
              <div className="text-2xl font-black text-white">{countdown.days}</div>
              <div className="text-[10px] uppercase text-zinc-500 font-bold">Days</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center min-w-[60px] border border-zinc-700">
              <div className="text-2xl font-black text-white">{countdown.hours}</div>
              <div className="text-[10px] uppercase text-zinc-500 font-bold">Hours</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center min-w-[60px] border border-zinc-700">
              <div className="text-2xl font-black text-white">{countdown.minutes}</div>
              <div className="text-[10px] uppercase text-zinc-500 font-bold">Mins</div>
            </div>
          </div>
        )}

        {/* Goal Time */}
        {race.goalTime && (
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <Clock className="w-4 h-4" />
            <span>Goal: <span className="text-white font-bold">{formatGoalTime(race.goalTime)}</span></span>
          </div>
        )}

        {/* Date */}
        <div className="text-sm text-zinc-500 mt-auto">
          {raceDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Other Upcoming Races */}
      {upcomingRaces.length > 1 && (
        <div className="border-t border-zinc-800/50 p-3 bg-zinc-900/50">
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Also Coming Up</div>
          <div className="space-y-1">
            {upcomingRaces.slice(1, 4).map((r) => (
              <div key={r.id} className="flex justify-between items-center text-xs py-1">
                <span className="text-zinc-300 truncate max-w-[150px]">{r.name}</span>
                <span className="text-zinc-500">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
