'use client';

import { getFeaturedProfile } from "@/app/actions/modular-profile";
import { StatsHeaderDetailed } from "./widgets/StatsHeader";
import { TrainingVolume } from "./widgets/TrainingVolume";
import { ActivityList } from "./widgets/ActivityList";
import { UpcomingEvents } from "./widgets/UpcomingEvents";
import { ActivityHeatmap } from "./widgets/ActivityHeatmap";
import { ConsistencyCalendar } from "./widgets/ConsistencyCalendar";
import { NextRace } from "./widgets/NextRace";
import { FormCurve } from "./widgets/FormCurve";
import Image from "next/image";
import { Instagram, Twitter, Youtube, Trophy, ExternalLink, Share2, Bell } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import dynamic from "next/dynamic";

const GridLayout = dynamic(
  () => import("react-grid-layout").then((mod) => {
    const RGL = mod.default || mod;
    // Handle WidthProvider export format variations
    const TypedMod = mod as any;
    const WidthProvider = TypedMod.WidthProvider || (RGL as any).WidthProvider;
    return WidthProvider ? WidthProvider(RGL) : RGL;
  }),
  { ssr: false }
) as any;

interface ModularProfileProps {
  data: NonNullable<Awaited<ReturnType<typeof getFeaturedProfile>>>;
}

// Helper function for formatting duration
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Extracted ProfileHeader component
function ProfileHeader({ user }: { user: ModularProfileProps['data']['user'] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4"
    >
      <div className="flex items-center gap-6">
        {user.avatarUrl ? (
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 rounded-full" />
            <img 
              src={user.avatarUrl} 
              alt={user.displayName || 'Athlete'} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-zinc-900 relative z-10"
            />
          </div>
        ) : (
           <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-zinc-900">
              {user.displayName?.[0] || 'A'}
           </div>
        )}
        
        <div>
           <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
             {user.displayName || 'Featured Athlete'}
           </h1>
           {user.tagline && (
             <p className="text-zinc-400 font-medium text-lg mt-1 max-w-xl">
               {user.tagline}
             </p>
           )}
        </div>
      </div>

      <div className="flex gap-4">
         {/* Social Links */}
         {!!user.socialLinks && typeof user.socialLinks === 'object' && (
           <div className="flex gap-2">
             {(user.socialLinks as any).instagram && (
                <Link href={(user.socialLinks as any).instagram} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                    <Instagram className="w-4 h-4" />
                </Link>
             )}
             {(user.socialLinks as any).twitter && (
                <Link href={(user.socialLinks as any).twitter} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                    <Twitter className="w-4 h-4" />
                </Link>
             )}
             {(user.socialLinks as any).youtube && (
                <Link href={(user.socialLinks as any).youtube} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                    <Youtube className="w-4 h-4" />
                </Link>
             )}
           </div>
         )}
         <Link href="/dashboard" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full font-bold text-sm transition-colors border border-zinc-700">
            Dashboard
         </Link>
      </div>
    </motion.div>
  );
}

export function ModularProfile({ data }: ModularProfileProps) {
  const { user, stats, recentActivities, previousRaces, upcomingEvents, upcomingRaces, calendarData, formCurve } = data;

  const widgets: Record<string, React.ReactNode> = {
    stats_header: <StatsHeaderDetailed stats={stats} />,
    next_race: <div className="h-full"><NextRace race={upcomingRaces?.[0] || null} upcomingRaces={upcomingRaces || []} /></div>,
    form_curve: <FormCurve data={formCurve || []} />,
    activity_map: (
      <div className="h-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 min-h-[280px]">
         <ActivityHeatmap activities={recentActivities} />
      </div>
    ),
    training_volume: (
      <div className="h-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
         <TrainingVolume activities={recentActivities} />
      </div>
    ),
    calendar: (
      <div className="h-full w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 overflow-x-auto">
         <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Training Consistency</h3>
         <ConsistencyCalendar data={calendarData || []} />
      </div>
    ),
    race_results: (
        <div className="h-full flex flex-col gap-6">
           <div className="h-full bg-[#18181b] rounded-xl border border-orange-500/20 overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-600" />
              <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-orange-500/5 to-transparent">
                 <h3 className="flex items-center gap-2 font-black italic uppercase tracking-wider text-xl text-orange-500">
                    <Trophy className="w-5 h-5" /> Race Results
                 </h3>
              </div>
              <div className="flex-1 overflow-auto p-2">
                 {previousRaces.length > 0 ? (
                   <div className="space-y-2">
                      {previousRaces.map((race, index) => (
                        <Link 
                          key={race.activityId} 
                          href={`/dashboard/activities/${race.activityId}`}
                          className="group block p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 transition-all border border-zinc-800 hover:border-orange-500/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10"
                        >
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-mono text-zinc-500">{new Date(race.startDate).getFullYear()}</span>
                              <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                                 {race.type}
                              </span>
                           </div>
                           <h4 className="font-bold text-white text-lg leading-tight group-hover:text-orange-400 transition-colors mb-2 flex items-center gap-2">
                             {race.name}
                             <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </h4>
                           <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Time</div>
                                <div className="font-mono text-zinc-300">{formatDuration(race.movingTime)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Dist</div>
                                <div className="font-mono text-zinc-300">{(race.distance * 0.000621371).toFixed(1)}mi</div>
                              </div>
                           </div>
                        </Link>
                      ))}
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">
                     No race results found
                   </div>
                 )}
              </div>
           </div>
        </div>
    ),
    recent_activities: (
       <div className="h-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 overflow-auto">
          <ActivityList activities={recentActivities} />
       </div>
    ),
  };
  
  // Custom Layout Render
  if (Array.isArray((user as any).layoutConfig)) {
      const layout = (user as any).layoutConfig as any[];
      return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 lg:p-8 font-sans">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <ProfileHeader user={user} />
            <div className="relative">
                <GridLayout
                  className="layout"
                  layout={layout}
                  cols={12}
                  rowHeight={30}
                  width={1600} // This should be responsive, but simplified for now
                  isDraggable={false}
                  isResizable={false}
                >
                   {layout.map((item: any) => (
                      <div key={item.i}>
                          {widgets[item.i]}
                      </div>
                   ))}
                </GridLayout>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Header: Identity */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4"
        >
          <div className="flex items-center gap-6">
            {user.avatarUrl ? (
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 rounded-full" />
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName || 'Athlete'} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-zinc-900 relative z-10"
                />
              </div>
            ) : (
               <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-zinc-900">
                  {user.displayName?.[0] || 'A'}
               </div>
            )}
            
            <div>
               <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
                 {user.displayName || 'Featured Athlete'}
               </h1>
               {user.tagline && (
                 <p className="text-zinc-400 font-medium text-lg mt-1 max-w-xl">
                   {user.tagline}
                 </p>
               )}
            </div>
          </div>

          <div className="flex gap-4">
             {/* Social Links */}
             {/* Social Links */}
             {!!user.socialLinks && typeof user.socialLinks === 'object' && (
               <div className="flex gap-2">
                 {(user.socialLinks as any).instagram && (
                    <Link href={(user.socialLinks as any).instagram} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Instagram className="w-4 h-4" />
                    </Link>
                 )}
                 {(user.socialLinks as any).twitter && (
                    <Link href={(user.socialLinks as any).twitter} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Twitter className="w-4 h-4" />
                    </Link>
                 )}
                 {(user.socialLinks as any).youtube && (
                    <Link href={(user.socialLinks as any).youtube} target="_blank" className="p-2 bg-zinc-800 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Youtube className="w-4 h-4" />
                    </Link>
                 )}
               </div>
             )}
             <Link href="/dashboard" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full font-bold text-sm transition-colors border border-zinc-700">
                Dashboard
             </Link>
          </div>
        </motion.div>

        {/* Row 1: Summary Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <StatsHeaderDetailed stats={stats} />
        </motion.div>

        {/* Row 2: Fan-First Hero Section - What's Next + Training Status */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
           {/* Left: Next Race Countdown (High Priority for Fans) */}
           <div className="lg:col-span-1">
              <NextRace race={upcomingRaces?.[0] || null} upcomingRaces={upcomingRaces || []} />
           </div>

           {/* Center: Form Curve - Training Trend */}
           <div className="lg:col-span-1">
              <FormCurve data={formCurve || []} />
           </div>

           {/* Right: Activity Heatmap - Where They Train */}
           <div className="lg:col-span-1 bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 min-h-[280px]">
              <ActivityHeatmap activities={recentActivities} />
           </div>
        </motion.div>

        {/* Row 2.5: Training Volume Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-1"
        >
           <TrainingVolume activities={recentActivities} />
        </motion.div>
        
        {/* Row 2.5: Consistency Calendar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 overflow-x-auto"
        >
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Training Consistency</h3>
            <ConsistencyCalendar data={calendarData || []} />
        </motion.div>

        {/* Row 3: Splits - Recent Races & Feed - Scrollable sections */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px] lg:min-h-[500px]"
        >
           {/* Left: Previous Races / Highlights */}
           <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-[#18181b] rounded-xl border border-orange-500/20 overflow-hidden flex-1 flex flex-col relative">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-600" />
                 <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <h3 className="flex items-center gap-2 font-black italic uppercase tracking-wider text-xl text-orange-500">
                       <Trophy className="w-5 h-5" /> Race Results
                    </h3>
                 </div>
                 
                 <div className="flex-1 overflow-auto p-2">
                    {previousRaces.length > 0 ? (
                      <div className="space-y-2">
                         {previousRaces.map((race, index) => (
                           <Link 
                             key={race.activityId} 
                             href={`/dashboard/activities/${race.activityId}`}
                             className="group block p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 transition-all border border-zinc-800 hover:border-orange-500/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10"
                             style={{ animationDelay: `${index * 50}ms` }}
                           >
                              <div className="flex justify-between items-start mb-1">
                                 <span className="text-xs font-mono text-zinc-500">{new Date(race.startDate).getFullYear()}</span>
                                 <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                                    {race.type}
                                 </span>
                              </div>
                              <h4 className="font-bold text-white text-lg leading-tight group-hover:text-orange-400 transition-colors mb-2 flex items-center gap-2">
                                {race.name}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </h4>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                 <div>
                                   <div className="text-[10px] uppercase text-zinc-500 font-bold">Time</div>
                                   <div className="font-mono text-zinc-300">{formatDuration(race.movingTime)}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] uppercase text-zinc-500 font-bold">Dist</div>
                                   <div className="font-mono text-zinc-300">{(race.distance * 0.000621371).toFixed(1)}mi</div>
                                 </div>
                                 {race.sufferScore && (
                                   <div>
                                      <div className="text-[10px] uppercase text-red-500/70 font-bold">Suffer</div>
                                      <div className="font-mono text-red-500 font-bold">{race.sufferScore}</div>
                                   </div>
                                 )}
                              </div>
                           </Link>
                         ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">
                        No race results found
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Right: Recent Activity Feed */}
           <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
              <ActivityList activities={recentActivities} />
           </div>
        </motion.div>

      </div>
    </div>
  );
}


