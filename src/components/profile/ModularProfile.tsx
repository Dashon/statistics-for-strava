'use client';

import { useState } from 'react';
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
import { Instagram, Twitter, Youtube, Trophy, ExternalLink, Share2, Bell, Edit3 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import dynamic from "next/dynamic";
import { CinematicHero } from "./CinematicHero";
import { ProfileEditorDock } from "./ProfileEditorDock";
import { AccoladeVault } from "./AccoladeVault";
import { StoriesStrip } from "./StoriesStrip";
import { cn } from "@/lib/utils";

// ... existing code ...

export function ModularProfile({ data, isOwner = false }: ModularProfileProps) {
  const {  stats, recentActivities, previousRaces, upcomingEvents, upcomingRaces, calendarData, formCurve } = data;
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for WYSIWYG editing
  const [userState, setUserState] = useState(data.user);
  
  const handleProfileUpdate = (newData: Partial<typeof userState>) => {
    setUserState(prev => ({ ...prev, ...newData }));
  };

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
  
  // Custom Layout Render using Grid Layout (Legacy or Specific Config)
  if (Array.isArray((userState as any).layoutConfig)) {
      const layout = (userState as any).layoutConfig as any[];
      return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 lg:p-8 font-sans">
          <div className="max-w-[1600px] mx-auto space-y-6">
             {/* Note: ProfileHeader is removed here as we switch to CinematicHero */}
            <CinematicHero 
               user={userState} 
               heroImageUrl={userState.heroImageUrl}
               isEditing={isEditing}
               onHeroUpdate={(url) => handleProfileUpdate({ heroImageUrl: url })}
            />
            
            <div className="relative">
                <GridLayout
                  className="layout"
                  layout={layout}
                  cols={12}
                  rowHeight={30}
                  width={1600} 
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

  // --- TEMPLATE-BASED RENDER LOGIC ---
  const templateId = (userState.templateId as string) || 'runner';

  // Define Layout Variants
  const renderTemplateContent = () => {
    switch (templateId) {
      case 'minimal':
        return (
          <div className="max-w-4xl mx-auto space-y-12">
             <StatsHeaderDetailed stats={stats} />
             
             {/* Simple list for minimal */}
             <div className="grid grid-cols-1 gap-8">
                <div>
                   <h3 className="line-clamp-1 mb-4 text-zinc-500 font-mono uppercase text-xs tracking-widest">Recent Activity</h3>
                   <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                      <ActivityList activities={recentActivities.slice(0, 5)} />
                   </div>
                </div>
                <div>
                  <h3 className="line-clamp-1 mb-4 text-zinc-500 font-mono uppercase text-xs tracking-widest">Calendar</h3>
                   <ConsistencyCalendar data={calendarData || []} />
                </div>
             </div>
          </div>
        );

      case 'racer':
        return (
          <div className="max-w-[1600px] mx-auto space-y-8">
             <StatsHeaderDetailed stats={stats} />
             
             {/* Racer Focus: Next Race & Form Curve */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px]">
                   <NextRace race={upcomingRaces?.[0] || null} upcomingRaces={upcomingRaces || []} />
                </div>
                <div className="h-[400px]">
                   <FormCurve data={formCurve || []} />
                </div>
             </div>

             {/* Results Priority */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 h-[600px]">
                   {widgets.race_results}
                </div>
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 h-[300px]">
                      <TrainingVolume activities={recentActivities} />
                   </div>
                   <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
                      <ConsistencyCalendar data={calendarData || []} />
                   </div>
                </div>
             </div>
          </div>
        );
      
      case 'global':
        return (
           <div className="max-w-[1800px] mx-auto space-y-8">
               <StatsHeaderDetailed stats={stats} />
               
               {/* Map Centric */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 h-[500px] bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
                      <ActivityHeatmap activities={recentActivities} />
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                      <div className="h-[240px]">
                        <NextRace race={upcomingRaces?.[0] || null} upcomingRaces={upcomingRaces || []} />
                      </div>
                      <div className="h-[240px] bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
                        <TrainingVolume activities={recentActivities} />
                      </div>
                  </div>
               </div>
               
               <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"> 
                  <ConsistencyCalendar data={calendarData || []} />
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-[400px]">
                      {widgets.race_results}
                  </div>
                  <div className="h-[400px] bg-zinc-900/50 rounded-xl border border-zinc-800 p-1 overflow-hidden">
                      <ActivityList activities={recentActivities} />
                  </div>
               </div>
           </div>
        );

      case 'runner':
      default:
        // The default "comprehensive" runner layout
        return (
          <div className="max-w-[1600px] mx-auto space-y-6">
             {/* Row 1: Summary Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <StatsHeaderDetailed stats={stats} />
            </motion.div>

            {/* NEW: Accolade Vault */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            >
              <AccoladeVault 
                  accolades={(userState.accolades as any[]) || []}
                  isEditing={isEditing}
              />
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

            {/* Row 2.5: Stories Strip (Highlights) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StoriesStrip activities={recentActivities} />
            </motion.div>

            {/* Row 3: Training Volume Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-1"
            >
              <TrainingVolume activities={recentActivities} />
            </motion.div>
            
            {/* Row 3.5: Consistency Calendar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 overflow-x-auto"
            >
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Training Consistency</h3>
                <ConsistencyCalendar data={calendarData || []} />
            </motion.div>

            {/* Row 4: Splits - Recent Races & Feed - Scrollable sections */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px] lg:min-h-[500px]"
            >
              {/* Left: Previous Races / Highlights */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {widgets.race_results}
              </div>

              {/* Right: Recent Activity Feed */}
              <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
                  <ActivityList activities={recentActivities} />
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-zinc-950 text-white pb-32 font-sans relative",
      // Template specific background tweaks
      templateId === 'minimal' && "bg-black"
    )}>
      
      {/* Edit Toggle for Owner */}
      {isOwner && !isEditing && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsEditing(true)}
          className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-white text-black font-bold rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </motion.button>
      )}

      {/* Profile Editor Dock */}
      <AnimatePresence>
        {isEditing && (
          <ProfileEditorDock 
            initialData={{
              templateId: (userState.templateId as any) || 'runner',
              displayName: userState.displayName || '',
              tagline: userState.tagline || '',
              countryCode: userState.countryCode || undefined
            }}
            onUpdate={handleProfileUpdate}
            onClose={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Cinematic Hero - Always at top for Runner/Racer/Global, maybe smaller for Minimal? */}
      {templateId !== 'minimal' && (
         <div className="w-full">
            <CinematicHero 
              user={userState} 
              heroImageUrl={userState.heroImageUrl}
              isEditing={isEditing}
              onHeroUpdate={(url) => handleProfileUpdate({ heroImageUrl: url })}
            />
         </div>
      )}

      <div className="p-4 md:p-6 lg:p-8">
         {/* Social Links - Consistent across templates */}
         <div className="flex justify-end gap-2 border-b border-zinc-800 pb-4 mb-8 max-w-[1600px] mx-auto">
             {!!userState.socialLinks && typeof userState.socialLinks === 'object' && (
               <>
                 {(userState.socialLinks as any).instagram && (
                    <Link href={(userState.socialLinks as any).instagram} target="_blank" className="p-2 bg-zinc-900 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Instagram className="w-4 h-4" />
                    </Link>
                 )}
                 {(userState.socialLinks as any).twitter && (
                    <Link href={(userState.socialLinks as any).twitter} target="_blank" className="p-2 bg-zinc-900 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Twitter className="w-4 h-4" />
                    </Link>
                 )}
                 {(userState.socialLinks as any).youtube && (
                    <Link href={(userState.socialLinks as any).youtube} target="_blank" className="p-2 bg-zinc-900 rounded-full hover:bg-orange-600 hover:text-white transition-colors text-zinc-400">
                        <Youtube className="w-4 h-4" />
                    </Link>
                 )}
               </>
             )}
             <Link href="/dashboard" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full font-bold text-sm transition-colors border border-zinc-700">
                Dashboard
             </Link>
        </div>

        {/* Minimal Hero (if selected) */}
        {templateId === 'minimal' && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800">
                   {userState.heroImageUrl || userState.stravaProfilePicture ? (
                     <Image src={userState.heroImageUrl || userState.stravaProfilePicture!} alt="Profile" fill className="object-cover" />
                   ) : (
                     <div className="w-full h-full bg-zinc-800" />
                   )}
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">{userState.displayName || 'Athlete'}</h1>
                  <p className="text-zinc-500 font-medium">{userState.tagline || 'Endurance Athlete'}</p>
                </div>
            </div>
          </div>
        )}

        {/* Render the specific template layout */}
        {renderTemplateContent()}
        
      </div>
    </div>
  );
}


