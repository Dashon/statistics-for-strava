import { formatDuration, formatDistance, formatElevation } from "@/lib/utils";

import { DashboardStats } from "@/app/actions/modular-profile";

export function StatsHeader({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 rounded-xl overflow-hidden shadow-lg border border-cyan-900/20">
      {/* Title */}
      <div className="bg-cyan-600 p-6 flex flex-col justify-center">
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-0 leading-none">
          Summary
        </h2>
        <span className="text-cyan-100 text-xs font-medium uppercase tracking-widest mt-1">All Time Stats</span>
      </div>

      {/* Activities */}
      <div className="bg-cyan-600/95 p-6 border-l border-cyan-500/30 flex flex-col justify-center">
        <span className="text-cyan-50 font-bold uppercase text-xs tracking-wider mb-1">Activities</span>
        <div className="text-4xl font-black text-white leading-none">
          {stats.totalActivities}
        </div>
      </div>

      {/* Distance */}
      <div className="bg-cyan-600/90 p-6 border-l border-cyan-500/30 flex flex-col justify-center">
        <span className="text-cyan-50 font-bold uppercase text-xs tracking-wider mb-1">Distance</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white leading-none">{formatDistance(stats.totalDistance)}</span>
          <span className="text-lg font-bold text-cyan-200">mi</span>
        </div>
      </div>

      {/* Time & Elevation - Split or Single? Image shows Time and Elevation separate. Let's do 5 columns? Or merge.  
         Image has: Summary | Activities | Distance | Time | Elevation Gain. That's 5 blocks. 
         I used 4 cols grid. I'll stick to 4 and put Last two in one? Or make it 5 cols.
         Tailwind grid-cols-5 works.
      */}
    </div>
  );
}

// Rewriting for 5 columns layout matching reference image
export function StatsHeaderDetailed({ 
  stats, 
  scope = 'all_time', 
  onScopeChange 
}: { 
  stats: DashboardStats;
  scope?: 'all_time' | 'current_year';
  onScopeChange?: (scope: 'all_time' | 'current_year') => void;
}) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 rounded-xl overflow-hidden shadow-2xl border border-cyan-900/20 mb-6 font-sans">
        {/* Title & Toggle */}
        <div className="bg-cyan-600 p-4 md:p-6 flex flex-col justify-center col-span-2 md:col-span-1 relative group">
          <div className="flex flex-row md:flex-col justify-between items-baseline md:items-start gap-2">
            <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase mb-0 leading-none">
              Summary
            </h2>
            <div className="flex items-center gap-2 mt-1 md:mt-2">
               <button 
                 onClick={() => onScopeChange?.('current_year')}
                 className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors border ${scope === 'current_year' ? 'bg-white text-cyan-900 border-white' : 'text-cyan-100 border-transparent hover:bg-white/10'}`}
               >
                 This Year
               </button>
               <span className="text-cyan-400/50 hidden md:inline">|</span>
               <button 
                 onClick={() => onScopeChange?.('all_time')}
                 className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors border ${scope === 'all_time' ? 'bg-white text-cyan-900 border-white' : 'text-cyan-100 border-transparent hover:bg-white/10'}`}
               >
                 All Time
               </button>
            </div>
          </div>
        </div>
  
        {/* Activities */}
        <div className="bg-[#0891b2] p-4 md:p-6 border-l border-cyan-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Activities</span>
          <div className="text-3xl md:text-4xl font-black text-white leading-none">
            {stats.totalActivities}
          </div>
        </div>
  
        {/* Distance */}
        <div className="bg-[#0e7490] p-4 md:p-6 border-l border-cyan-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Distance</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-black text-white leading-none">{formatDistance(stats.totalDistance)}</span>
            <span className="text-sm md:text-lg font-bold text-white/60">mi</span>
          </div>
        </div>
        
        {/* Time */}
        <div className="bg-[#155e75] p-4 md:p-6 border-l border-cyan-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Time</span>
          <div className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight whitespace-nowrap">
            {formatDuration(stats.totalTime)}
          </div>
        </div>

        {/* Elevation */}
        <div className="bg-[#164e63] p-4 md:p-6 border-l border-cyan-500/20 flex flex-col justify-center">
            <span className="text-white/80 font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1">Elevation gain</span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-black text-white leading-none">{formatElevation(stats.totalElevation)}</span>
                <span className="text-sm md:text-lg font-bold text-white/60">ft</span>
            </div>
        </div>
      </div>
    );
  }
