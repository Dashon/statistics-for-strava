
"use client";

import { Activity, Brain, AlertTriangle, CheckCircle, Play, Loader2, Headphones } from "lucide-react";
import { useState } from "react";
import { generateDailyBriefing, getBriefingStatus } from "@/app/actions/audio-briefing";
import { useRouter } from "next/navigation";

interface ReadinessCardProps {
  score: number;
  risk: string;
  summary: string;
  recommendation: string;
  date: string;
  audioUrl?: string | null;
}

export const ReadinessCard = ({ score, risk, summary, recommendation, date, audioUrl }: ReadinessCardProps) => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBriefing = async () => {
    setIsGenerating(true);
    try {
      await generateDailyBriefing();
      
      // Poll for completion
      const interval = setInterval(async () => {
          const result = await getBriefingStatus();
          if (result.status === 'completed') {
              clearInterval(interval);
              setIsGenerating(false);
              router.refresh(); // Refresh to show the new audio URL
          }
      }, 3000); // Check every 3 seconds

      // Timeout after 60s
      setTimeout(() => {
          clearInterval(interval);
          setIsGenerating(false);
      }, 60000);

    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  // Determine color theme based on score/risk
  let colorClass = "bg-zinc-800 border-zinc-700";
  let textClass = "text-zinc-200";
  let icon = <Brain className="w-6 h-6" />;
  
  if (risk === 'critical' || score < 40) {
    colorClass = "bg-red-950/40 border-red-900/50";
    textClass = "text-red-200";
    icon = <AlertTriangle className="w-6 h-6 text-red-500" />;
  } else if (risk === 'high' || score < 60) {
    colorClass = "bg-orange-950/40 border-orange-900/50";
    textClass = "text-orange-200";
    icon = <AlertTriangle className="w-6 h-6 text-orange-500" />;
  } else if (risk === 'moderate' || score < 80) {
    colorClass = "bg-yellow-950/40 border-yellow-900/50";
    textClass = "text-yellow-200";
    icon = <Activity className="w-6 h-6 text-yellow-500" />;
  } else {
    colorClass = "bg-green-950/40 border-green-900/50";
    textClass = "text-green-200";
    icon = <CheckCircle className="w-6 h-6 text-green-500" />;
  }

  return (
    <div className={`p-6 rounded-xl border ${colorClass} backdrop-blur-sm shadow-xl`}>
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        
        {/* Score Circle */}
        <div className="flex-shrink-0">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
            risk === 'critical' ? 'border-red-500 bg-red-500/10' :
            risk === 'high' ? 'border-orange-500 bg-orange-500/10' :
            risk === 'moderate' ? 'border-yellow-500 bg-yellow-500/10' :
            'border-green-500 bg-green-500/10'
          }`}>
            <div className="text-center">
              <span className="text-3xl font-bold text-white block leading-none">{score}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-70">Readiness</span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className={`text-lg font-bold uppercase tracking-wide ${textClass}`}>
              Training Director Insight
            </h3>
            <span className="text-xs text-zinc-500 ml-auto font-mono">
              {new Date(date).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            {summary}
          </p>
          
          <div className="mt-3 bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
              Coach Recommendation
            </span>
            <p className="text-sm text-white italic">
              "{recommendation}"
            </p>
          </div>
  
          {/* Audio Briefing Section */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
            {audioUrl ? (
               <div className="bg-zinc-900/50 rounded-full px-4 py-2 flex items-center gap-3 border border-zinc-700 w-full md:w-auto">
                 <div className="bg-indigo-500 rounded-full p-1.5 animate-pulse">
                    <Headphones size={14} className="text-white" />
                 </div>
                 <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
                 <span className="text-xs text-zinc-400 font-medium whitespace-nowrap hidden sm:inline">Daily Briefing</span>
               </div>
            ) : (
                <button 
                  onClick={handleGenerateBriefing}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  {isGenerating ? "Generating..." : "Play Daily Briefing"}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
