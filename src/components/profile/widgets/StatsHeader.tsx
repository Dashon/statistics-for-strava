import { DashboardStats } from "@/app/actions/modular-profile";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`; // Seconds 00 for visuals
}

function formatDistance(meters: number): string {
  // Convert meters to miles
  const miles = meters * 0.000621371;
  return Math.round(miles).toLocaleString();
}

function formatElevation(meters: number): string {
  // Convert meters to feet
  const feet = meters * 3.28084;
  return Math.round(feet).toLocaleString();
}

export function StatsHeader({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 rounded-xl overflow-hidden shadow-lg border border-orange-900/20">
      {/* Title */}
      <div className="bg-orange-600 p-6 flex flex-col justify-center">
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-0 leading-none">
          Summary
        </h2>
        <span className="text-orange-200 text-xs font-medium uppercase tracking-widest mt-1">All Time Stats</span>
      </div>

      {/* Activities */}
      <div className="bg-orange-600/95 p-6 border-l border-orange-500/30 flex flex-col justify-center">
        <span className="text-orange-100 font-bold uppercase text-xs tracking-wider mb-1">Activities</span>
        <div className="text-4xl font-black text-white leading-none">
          {stats.totalActivities}
        </div>
      </div>

      {/* Distance */}
      <div className="bg-orange-600/90 p-6 border-l border-orange-500/30 flex flex-col justify-center">
        <span className="text-orange-100 font-bold uppercase text-xs tracking-wider mb-1">Distance</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white leading-none">{formatDistance(stats.totalDistance)}</span>
          <span className="text-lg font-bold text-orange-200">mi</span>
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
export function StatsHeaderDetailed({ stats }: { stats: DashboardStats }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 rounded-xl overflow-hidden shadow-2xl border border-orange-900/20 mb-6">
        {/* Title */}
        <div className="bg-orange-600 p-6 flex flex-col justify-center col-span-2 md:col-span-1">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-0 leading-none">
            Summary
          </h2>
        </div>
  
        {/* Activities */}
        <div className="bg-[#cd4600] p-6 border-l border-orange-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-xs tracking-wider mb-1">Activities</span>
          <div className="text-4xl font-black text-white leading-none">
            {stats.totalActivities}
          </div>
        </div>
  
        {/* Distance */}
        <div className="bg-[#b33d00] p-6 border-l border-orange-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-xs tracking-wider mb-1">Distance</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white leading-none">{formatDistance(stats.totalDistance)}</span>
            <span className="text-lg font-bold text-white/60">mi</span>
          </div>
        </div>
        
        {/* Time */}
        <div className="bg-[#993400] p-6 border-l border-orange-500/20 flex flex-col justify-center">
          <span className="text-white/80 font-bold uppercase text-xs tracking-wider mb-1">Time</span>
          <div className="text-4xl font-black text-white leading-none tracking-tight">
            {formatDuration(stats.totalTime)}
          </div>
        </div>

        {/* Elevation */}
        <div className="bg-[#802b00] p-6 border-l border-orange-500/20 flex flex-col justify-center">
            <span className="text-white/80 font-bold uppercase text-xs tracking-wider mb-1">Elevation gain</span>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white leading-none">{formatElevation(stats.totalElevation)}</span>
                <span className="text-lg font-bold text-white/60">ft</span>
            </div>
        </div>
      </div>
    );
  }
