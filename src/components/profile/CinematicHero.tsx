'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { generateProfileHero } from '@/app/actions/cinematic-profile';
import { updateProfileHero } from '@/app/actions/media';
import { MediaManager } from '../common/MediaManager';

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

/**
 * CinematicHero - Apple-style glassmorphic background
 * 
 * This component renders a subtle, faded background image with:
 * - Heavy blur (40px) for frosted glass effect
 * - Very low opacity (0.15) so it doesn't overwhelm content
 * - Grain texture overlay for premium feel
 * - Fixed position to cover entire viewport
 */
export function CinematicHero({ heroImageUrl, user, isEditing, onHeroUpdate }: CinematicHeroProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [currentHeroUrl, setCurrentHeroUrl] = useState(heroImageUrl);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateProfileHero();
      if (result.success && result.heroUrl) {
        setCurrentHeroUrl(result.heroUrl);
        onHeroUpdate?.(result.heroUrl);
        setShowMediaManager(false);
      } else {
        console.error('Failed to generate hero:', result.error);
      }
    } catch (error) {
      console.error('Error generating hero:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualUpdate = async (url: string) => {
    setCurrentHeroUrl(url);
    onHeroUpdate?.(url);
    await updateProfileHero(url);
    setShowMediaManager(false);
  };

  return (
    <>
      {/* Fixed Background Layer - Apple Glass Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Hero Image - Heavily blurred and faded */}
        <AnimatePresence mode="wait">
          {currentHeroUrl ? (
            <motion.div
              key={currentHeroUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              {/* The actual image with blur */}
              <img
                src={currentHeroUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'blur(40px) saturate(120%)',
                  opacity: 0.15,
                  transform: 'scale(1.1)', // Prevent blur edge artifacts
                }}
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
          )}
        </AnimatePresence>

        {/* Grain Texture Overlay for premium feel */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-zinc-950/80" />
        
        {/* Top fade for header area */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-zinc-950/60 to-transparent" />
      </div>

      {/* Edit Button - Only visible when editing */}
      {isEditing && !showMediaManager && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 z-50"
        >
          <button
            onClick={() => setShowMediaManager(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl text-white font-medium transition-all flex items-center gap-2 shadow-2xl"
          >
            <Camera className="w-4 h-4" />
            <span>Change Background</span>
          </button>
        </motion.div>
      )}

      {/* Media Manager Modal */}
      <AnimatePresence>
        {isEditing && showMediaManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMediaManager(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[450px] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMediaManager(false)}
                className="absolute -top-3 -right-3 z-40 bg-zinc-800 text-white p-2 rounded-full border border-zinc-700 shadow-xl hover:bg-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white">Background Image</h3>
                  <p className="text-sm text-zinc-400 mt-1">Choose a subtle background for your profile</p>
                </div>
                <MediaManager
                  type="profile"
                  currentUrl={currentHeroUrl}
                  onUpdate={handleManualUpdate}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

