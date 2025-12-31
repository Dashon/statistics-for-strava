'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, X, Check, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { getMediaUploadUrl } from '@/app/actions/media';

interface MediaManagerProps {
  type: 'profile' | 'activity';
  id?: string; // activityId for activity type (profile updates based on auth session)
  currentUrl?: string | null;
  onUpdate: (url: string) => void;
  onGenerate?: () => Promise<void>; // External generation handler
  isGenerating?: boolean; // Prop to control external generation state
}

export function MediaManager({ 
  type, 
  id, 
  currentUrl, 
  onUpdate, 
  onGenerate,
  isGenerating = false 
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset error
    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Get signed URL
      const folder = type === 'profile' ? 'heroes' : 'activities';
      // extract extension
      const ext = file.name.split('.').pop() || 'png';
      
      const { signedUrl, publicUrl, error } = await getMediaUploadUrl(folder, ext);
      
      if (error || !signedUrl) {
        throw new Error(error || "Failed to get upload URL");
      }

      // 2. Upload file
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      // 3. Callback with new URL
      onUpdate(publicUrl);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl w-full max-w-md">
      {/* Header Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'generate' 
              ? 'bg-zinc-800 text-white' 
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'upload' 
              ? 'bg-zinc-800 text-white' 
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Custom
        </button>
      </div>

      <div className="p-6 min-h-[200px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div 
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                 <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-lg font-bold text-white">Cinematic AI Poster</h3>
                 <p className="text-sm text-zinc-400 max-w-[280px] mx-auto">
                   {type === 'profile' 
                     ? "Generate a hyper-realistic poster based on your latest activity location."
                     : "Create a 3D street-view visualization of this activity's route."
                   }
                 </p>
              </div>

              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-white text-black font-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Generate New Art
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
               <input 
                 type="file" 
                 accept="image/*"
                 ref={fileInputRef}
                 onChange={handleFileUpload}
                 className="hidden" 
               />
               
               <div 
                 onClick={() => !isUploading && fileInputRef.current?.click()}
                 className={`border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-500 transition-colors bg-zinc-900/50 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
               >
                 {isUploading ? (
                   <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                 ) : (
                   <ImageIcon className="w-8 h-8 text-zinc-500" />
                 )}
                 <div className="text-center">
                    <p className="font-bold text-zinc-300">Click to Upload</p>
                    <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WEBP (Max 5MB)</p>
                 </div>
               </div>
               
               {uploadError && (
                 <p className="text-xs text-red-500 text-center">{uploadError}</p>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
