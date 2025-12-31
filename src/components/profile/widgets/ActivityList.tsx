'use client';

import { ActivitySummary } from "@/app/actions/modular-profile";
import Link from "next/link";
import { Trophy, ExternalLink, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityListProps {
  activities: ActivitySummary[];
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
    return (meters * 0.000621371).toFixed(1) + " mi";
}

function formatElevation(meters: number): string {
    return Math.round(meters * 3.28084) + " ft";
}

// Animation variants for staggered list
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.1
        }
    }
};

const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Recent Activities</h3>
            <span className="text-zinc-500 text-xs">{activities.length} activities</span>
        </div>
        
        <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider text-right">Dist</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider text-right">Time</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider text-center">HR</th>
                        <th className="px-4 py-3 font-medium uppercase tracking-wider text-right">Elev</th>
                        <th className="px-4 py-3 w-8"></th>
                    </tr>
                </thead>
                <motion.tbody 
                    className="divide-y divide-zinc-800/50"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {activities.map((act, index) => {
                        const isRace = act.workoutType === '1' || act.workoutType === '11';
                        
                        return (
                            <motion.tr 
                                key={act.activityId} 
                                variants={rowVariants}
                                className={`group cursor-pointer transition-all duration-200 ${
                                    isRace 
                                        ? 'bg-orange-500/5 hover:bg-orange-500/15' 
                                        : 'hover:bg-zinc-800/50'
                                }`}
                                whileHover={{ 
                                    scale: 1.005, 
                                    backgroundColor: isRace ? 'rgba(249, 115, 22, 0.15)' : 'rgba(39, 39, 42, 0.5)'
                                }}
                                onClick={() => window.location.href = `/dashboard/activities/${act.activityId}`}
                            >
                                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap font-mono text-xs">
                                    {new Date(act.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 font-medium text-zinc-200">
                                    <div className="flex items-center gap-2">
                                        {isRace && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" />}
                                        <span className="truncate max-w-[200px] group-hover:text-orange-400 transition-colors">{act.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-zinc-400">
                                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{act.type}</span>
                                </td>
                                <td className="px-4 py-3 text-zinc-200 text-right font-mono">
                                    {formatDistance(act.distance)}
                                </td>
                                <td className="px-4 py-3 text-zinc-200 text-right font-mono">
                                    {formatDuration(act.movingTime)}
                                </td>
                                <td className={`px-4 py-3 text-center font-mono font-bold ${
                                    (act.averageHeartRate || 0) > 160 ? 'text-red-500' : 
                                    (act.averageHeartRate || 0) > 140 ? 'text-orange-500' : 'text-zinc-500'
                                }`}>
                                    {act.averageHeartRate ? (
                                        <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-xs">
                                            {Math.round(act.averageHeartRate)}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-zinc-400 text-right font-mono">
                                    {formatElevation(act.totalElevationGain)}
                                </td>
                                <td className="px-4 py-2 text-zinc-600 group-hover:text-orange-500 transition-colors">
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-200" />
                                </td>
                            </motion.tr>
                        );
                    })}
                </motion.tbody>
            </table>
        </div>
    </div>
  );
}
