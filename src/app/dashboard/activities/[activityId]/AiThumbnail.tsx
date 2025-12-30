"use client";

import { useState, useEffect, useRef } from "react";
import { generateThumbnail } from "@/app/actions/generate-thumbnail";
import { getGenerationStatus } from "@/app/actions/get-generation-status";
import { MapPin, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AiThumbnailProps {
  activityId: string;
  thumbnailUrl: string | null;
  thumbnailPrompt: string | null;
  videoUrl?: string | null;
}

export default function AiThumbnail({ activityId, thumbnailUrl, thumbnailPrompt, videoUrl }: AiThumbnailProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const hasTriggered = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-trigger generation on mount if no thumbnail exists
  useEffect(() => {
    if (!thumbnailUrl && !hasTriggered.current) {
      hasTriggered.current = true;
      handleGenerate();
    }
  }, [thumbnailUrl]);

  // Handle video element
  useEffect(() => {
      if (isPlayingVideo && videoRef.current) {
          videoRef.current.play().catch(e => console.warn("Autoplay failed", e));
      }
  }, [isPlayingVideo]);

  // Poll for status when generating
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      interval = setInterval(async () => {
        try {
          const result = await getGenerationStatus(activityId);
          
          if ((result.thumbnailStatus === 'completed' || result.aiThumbnailUrl) && !isGenerating) {
             // basic thumbnail done
          }
          
          // Refresh if *either* thumbnail or video just finished appearing
          // But here we rely on the component re-rendering from router.refresh() 
          // triggered manually or by this poller
          if (result.thumbnailStatus === 'completed' || result.thumbnailStatus === 'failed') {
             setIsGenerating(false);
             clearInterval(interval);
             router.refresh();
          }

        } catch (e) {
          console.error("Failed to poll status", e);
        }
      }, 3000); 
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, activityId, router]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await generateThumbnail(activityId);
    } catch (error: any) {
      setError(error.message);
      setIsGenerating(false);
    }
  };

  // Show the thumbnail/video if we have data
  if (thumbnailUrl) {
    return (
      <div className="relative w-full h-full min-h-[400px] rounded-sm overflow-hidden group">
        
        {/* Video Player or Thumbnail Image */}
        {isPlayingVideo && videoUrl ? (
            <video 
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                controls={false}
            />
        ) : (
            <Image
            src={thumbnailUrl}
            alt="Street View of Activity Location"
            fill
            className="object-cover"
            />
        )}

        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors pointer-events-none" />
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#f97316]" />
              {isPlayingVideo ? "Route Video" : "Street View"}
            </p>
          </div>
          
          <div className="flex gap-2">
            {videoUrl && (
                <button 
                    onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                    className="bg-black/60 backdrop-blur-md p-2 rounded-sm border border-white/10 hover:bg-black transition-colors"
                    title={isPlayingVideo ? "Show Map" : "Play Video"}
                >
                    {isPlayingVideo ? (
                        <MapPin className="w-4 h-4 text-white" />
                    ) : (
                        <div className="relative w-4 h-4 text-white flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    )}
                </button>
            )}

            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-black/60 backdrop-blur-md p-2 rounded-sm border border-white/10 hover:bg-black transition-colors"
                title="Regenerate"
            >
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state 
  return (
    <div className="w-full h-full min-h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-sm flex flex-col items-center justify-center gap-4">
      {isGenerating ? (
        <>
          <Loader2 className="w-10 h-10 text-[#f97316] animate-spin" />
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Generating Visuals</p>
          </div>
        </>
      ) : error ? (
        <>
          <MapPin className="w-10 h-10 text-zinc-600" />
          <div className="text-center">
            <p className="text-xs text-red-500">{error}</p>
            <button 
              onClick={handleGenerate}
              className="mt-3 px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-sm hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </>
      ) : (
        <>
          <MapPin className="w-10 h-10 text-zinc-600" />
          <p className="text-xs text-zinc-500">Loading...</p>
        </>
      )}
    </div>
  );
}

