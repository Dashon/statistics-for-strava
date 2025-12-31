'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Camera, MapPin, RefreshCw } from 'lucide-react';
import { generateProfileHero } from '@/app/actions/cinematic-profile';

interface CinematicHeroProps {
  heroImageUrl?: string | null;
  user: {
    displayName?: string | null;
    tagline?: string | null;
    countryCode?: string | null;
  };
  isEditing?: boolean;
  onHeroUpdate?: (url: string) => void;
}

export function CinematicHero({ heroImageUrl, user, isEditing, onHeroUpdate }: CinematicHeroProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHeroUrl, setCurrentHeroUrl] = useState(heroImageUrl);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateProfileHero();
      if (result.success && result.heroUrl) {
        setCurrentHeroUrl(result.heroUrl);
        onHeroUpdate?.(result.heroUrl);
      } else {
        console.error('Failed to generate hero:', result.error);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error generating hero:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden rounded-2xl bg-zinc-900 group">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        {currentHeroUrl ? (
          <motion.img
            key={currentHeroUrl}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            src={currentHeroUrl}
            alt="Cinematic Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <div className="text-center p-8 opacity-50">
              <Camera className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">No cinematic poster yet</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent opacity-90" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10 flex flex-col items-start">
        {user.countryCode && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium">
             {/* Simple flag emoji fallback if no SVG available yet */}
             <span>Running in</span>
             <MapPin className="w-3 h-3 text-orange-500" />
             <span className="uppercase tracking-wider">{user.countryCode}</span>
          </div>
        )}
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
          {user.displayName || 'QT.run'}
        </h1>
        
        {user.tagline && (
          <div className="mt-4 flex items-center gap-3">
             <div className="h-1 w-12 bg-orange-500 rounded-full" />
             <p className="text-xl md:text-2xl font-medium text-zinc-200 tracking-wide">
               {user.tagline}
             </p>
          </div>
        )}
      </div>

      {/* Edit Overlay */}
      {isEditing && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="relative overflow-hidden group/btn px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span>Creating Poster...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-orange-400 group-hover/btn:text-orange-300 transition-colors" />
                <span>
                   {currentHeroUrl ? 'Regenerate Poster' : 'Generate Poster'}
                </span>
              </>
            )}
            
            {/* Shimmer effect */}
            {!isGenerating && (
               <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center">
           <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                 <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
                 <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Creating Cinematic Poster</h3>
              <p className="text-zinc-400">Analyzing your location & recent activity...</p>
           </div>
        </div>
      )}
    </div>
  );
}
