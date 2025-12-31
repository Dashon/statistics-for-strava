'use client';

import { DashboardStats, RaceEvent } from "@/app/actions/modular-profile";
import { Timer, Calendar, ExternalLink, Video } from "lucide-react";
import Link from "next/link";

interface UpcomingEventsProps {
  events: RaceEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="text-zinc-300 font-medium">No upcoming events</h3>
        <p className="text-sm text-zinc-500 mt-1">Check back later for race schedule</p>
      </div>
    );
  }

  const nextEvent = events[0];
  const otherEvents = events.slice(1);
  const eventDate = new Date(nextEvent.startTime);
  const now = new Date();
  
  // Simple countdown logic could go here, for now just display date clearly
  const isToday = eventDate.toDateString() === now.toDateString();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Featured Next Event */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl overflow-hidden shadow-lg border border-cyan-500/20 relative group">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-black/30 text-white/90 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm border border-white/10">
              Next Event
            </span>
            {nextEvent.isLive && (
               <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                Live Now
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-white italic tracking-tight leading-none mb-2">
            {nextEvent.title}
          </h3>
          
          <div className="flex items-center gap-2 text-cyan-100 mb-6 font-medium">
             <Calendar className="w-4 h-4" />
             {eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
             <span className="text-cyan-300">•</span>
             <Timer className="w-4 h-4" />
             {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </div>

          <Link 
            href={nextEvent.isLive ? `/athlete/dashon/live/${nextEvent.eventId}` : '#'} 
            className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all
              ${nextEvent.isLive 
                ? 'bg-white text-red-600 hover:bg-gray-100' 
                : 'bg-black/20 text-white hover:bg-black/30 border border-white/10'
              }`}
          >
            {nextEvent.isLive ? (
              <>
                <Video className="w-4 h-4" /> Watch Live
              </>
            ) : (
              <>
                Event Details <ExternalLink className="w-3 h-3" />
              </>
            )}
          </Link>
        </div>
      </div>

      {/* List of other events */}
      {otherEvents.length > 0 && (
         <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden flex-1">
            <div className="p-3 bg-zinc-900/80 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Future Schedule</h4>
            </div>
            <div className="divide-y divide-zinc-800">
                {otherEvents.map(event => (
                    <div key={event.eventId} className="p-3 hover:bg-zinc-800/50 transition-colors flex justify-between items-center group">
                        <div>
                            <div className="font-bold text-zinc-300 group-hover:text-cyan-400 transition-colors text-sm">{event.title}</div>
                            <div className="text-xs text-zinc-500">{new Date(event.startTime).toLocaleDateString()}</div>
                        </div>
                         {event.status === 'live' && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                         )}
                    </div>
                ))}
            </div>
         </div>
      )}
    </div>
  );
}
