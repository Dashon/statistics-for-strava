
"use client";

import { useState } from "react";
import { generateRunLetter } from "@/app/actions/letters";
import { Sparkles } from "lucide-react";

export default function GenerateLettersButton({ missingCount, activities }: { missingCount: number, activities: string[] }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startGeneration = async () => {
    if (loading) return;
    setLoading(true);
    
    let done = 0;
    for (const activityId of activities) {
      await generateRunLetter(activityId);
      done++;
      setProgress(Math.round((done / activities.length) * 100));
    }
    
    window.location.reload();
  };

  if (missingCount === 0) return null;

  return (
    <button
      onClick={startGeneration}
      disabled={loading}
      className={`flex items-center gap-3 ${loading ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-500 text-white hover:bg-orange-600'} px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/10`}
    >
      <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
      {loading ? `GENERATING ${progress}%` : `GENERATE ${missingCount} PENDING LETTERS`}
    </button>
  );
}
