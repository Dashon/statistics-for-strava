"use client";

import dynamic from "next/dynamic";

const Heatmap = dynamic(() => import("./Heatmap"), { 
    ssr: false,
    loading: () => (
        <div className="h-[calc(100vh-12rem)] w-full rounded-[2.5rem] border border-zinc-900 bg-zinc-950 flex items-center justify-center">
            <span className="text-zinc-700 animate-pulse font-bold uppercase tracking-widest text-sm">Visualizing paths...</span>
        </div>
    )
});

export default Heatmap;
