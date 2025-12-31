'use client';

import { motion } from 'framer-motion';
import { Play, MapPin, Calendar, Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
// import { activity as ActivityType } from '@/db/schema';

interface Story {
  id: string;
  title: string;
  date: string;
  image?: string; // Map thumbnail or photo
  videoUrl?: string; 
  stats: {
    distance: string;
    time: string;
  };
}

interface StoriesStripProps {
  activities: any[]; // Using any[] for flexibility with the join data we receive
}

export function StoriesStripProps({ activities }: StoriesStripProps) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" />
          The Last Training Cycle
        </h3>
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
           AI Highlights
        </span>
      </div>

      <div className="relative w-full overflow-x-auto pb-8 hide-scrollbar">
        {/* Film Strip Holes Design - Top */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-repeat-x z-10 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle, #3f3f46 2px, transparent 2.5px)', backgroundSize: '12px 100%' }} />

        <div className="flex gap-6 min-w-max px-2 pt-6">
          {activities.slice(0, 8).map((activity, index) => (
            <Link 
              href={`/dashboard/activities/${activity.activityId}`}
              key={activity.activityId}
            >
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative w-72 h-44 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-cyan-500/50 transition-colors shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
              >
                 {/* Thumbnail Image (Map or Photo) */}
                 <div className="absolute inset-0 bg-zinc-800">
                    {/* Placeholder for map static image logic - assuming we might have mapUrl later, for now we use a gradient or if we had a generic map image */}
                    {/* In a real app we'd use `activity.map.summary_polyline` to generate a static map URL or use a saved thumbnail */}
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative">
                        {/* Simulated Map Path */}
                         <svg className="w-full h-full absolute inset-0 text-zinc-700/30 p-8" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10,90 Q50,10 90,90" />
                         </svg>
                         
                         {/* Play Button Overlay (implying this is a 'story' or video) */}
                         <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500 transition-all z-10">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                         </div>
                    </div>
                 </div>
                 
                 {/* Gradient Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                 {/* Content */}
                 <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold bg-cyan-500 text-black px-1.5 py-0.5 rounded uppercase">
                          {activity.sportType || 'Run'}
                       </span>
                       <span className="text-zinc-400 text-xs font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.startDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </span>
                    </div>
                    
                    <h4 className="text-white font-bold text-sm leading-tight line-clamp-1 mb-1 group-hover:text-cyan-400 transition-colors">
                       {activity.name}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono">
                       <span>{(activity.distance * 0.000621371).toFixed(1)}mi</span>
                       <span className="w-1 h-1 bg-zinc-500 rounded-full" />
                       {/* Basic calc for duration if needed, or if we passed it in */}
                       <span>
                          {Math.floor((activity.movingTime || activity.elapsedTimeInSeconds || 0) / 60)}m
                       </span>
                    </div>
                 </div>

                 {/* Trim - Film Strip Borders */}
                 <div className="absolute top-0 bottom-0 left-0 w-1 bg-zinc-950 z-20" />
                 <div className="absolute top-0 bottom-0 right-0 w-1 bg-zinc-950 z-20" />
              </motion.div>
            </Link>
          ))}
          
          {/* View All Card */}
          <Link href="/dashboard/activities" className="group relative w-32 h-44 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                 <span className="font-bold text-sm">+{activities.length - 8 > 0 ? activities.length - 8 : ''}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">View All</span>
          </Link>

        </div>

        {/* Film Strip Holes Design - Bottom */}
        <div className="absolute bottom-4 left-0 right-0 h-4 bg-repeat-x z-10 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle, #3f3f46 2px, transparent 2.5px)', backgroundSize: '12px 100%' }} />

      </div>
    </div>
  );
}
