
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { triggerBatchGeneration } from "@/app/actions/trigger-jobs";
import { Sparkles } from "lucide-react";

export default function GenerateLettersButton({ missingCount, activities }: { missingCount: number, activities: string[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const startGeneration = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Trigger background jobs via Trigger.dev
      await triggerBatchGeneration(activities);

      // Refresh to show loading states
      router.refresh();
    } catch (error) {
      console.error('Failed to start generation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (missingCount === 0) return null;

  return (
    <button
      onClick={startGeneration}
      disabled={loading}
      className={`flex items-center gap-3 ${loading ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-600 text-white hover:bg-cyan-500'} px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-cyan-500/10`}
    >
      <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
      {loading ? `STARTING...` : `GENERATE ${missingCount} PENDING ${missingCount === 1 ? 'LETTER' : 'LETTERS'}`}
    </button>
  );
}
