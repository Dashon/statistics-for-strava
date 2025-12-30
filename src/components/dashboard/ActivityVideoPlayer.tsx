"use client";

import { Player } from "@remotion/player";
import { RouteVideo, RouteVideoProps } from "@/remotion/RouteVideo";
import { useState, useEffect } from "react";
import { Play, Maximize2 } from "lucide-react";

interface ActivityVideoPlayerProps extends RouteVideoProps {
  autoPlay?: boolean;
}

export default function ActivityVideoPlayer(props: ActivityVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-full h-full bg-black/90 animate-pulse" />;

  return (
    <div className="w-full h-full relative group overflow-hidden bg-black/90 rounded-xl border border-zinc-800/50 shadow-2xl">
      <div className="absolute inset-0 z-0">
        <Player
          component={RouteVideo as any}
          inputProps={props}
          durationInFrames={900} // 30 seconds at 30fps
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls={true}
          autoPlay={props.autoPlay}
          loop
          clickToPlay={true}
        />
      </div>
      
      {/* Overlay controls or branding could go here if controls={false} */}
    </div>
  );
}
