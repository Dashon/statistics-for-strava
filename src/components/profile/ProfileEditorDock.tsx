'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Type, 
  MapPin, 
  Globe, 
  Check, 
  X, 
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { updateCinematicProfile } from '@/app/actions/cinematic-profile';

type ProfileTemplate = 'runner' | 'racer' | 'global' | 'minimal';

interface ProfileEditorDockProps {
  initialData: {
    templateId: ProfileTemplate;
    displayName: string;
    tagline: string;
    countryCode?: string;
  };
  onUpdate: (data: any) => void;
  onClose: () => void;
}

const TEMPLATES = [
  { id: 'runner', name: 'Runner', emoji: '🏃‍♂️', color: 'from-cyan-500 to-blue-600' },
  { id: 'racer', name: 'Racer', emoji: '🏁', color: 'from-purple-500 to-pink-600' },
  { id: 'global', name: 'Global', emoji: '🌍', color: 'from-blue-500 to-cyan-600' },
  { id: 'minimal', name: 'Minimal', emoji: '✨', color: 'from-zinc-500 to-zinc-700' },
];

export function ProfileEditorDock({ initialData, onUpdate, onClose }: ProfileEditorDockProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'text'>('style');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for immediate preview
  const [formData, setFormData] = useState(initialData);

  const handleCreatePreview = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    // Instant preview in parent
    onUpdate(newData); 
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCinematicProfile({
        templateId: formData.templateId,
        displayName: formData.displayName,
        tagline: formData.tagline,
        countryCode: formData.countryCode,
      });
      onClose(); // Exit edit mode
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#0f0f11]/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-3xl z-50 overflow-hidden ring-1 ring-white/10"
    >
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'style' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            Style
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'text' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Type className="w-4 h-4" />
            Details
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'style' ? (
            <motion.div 
              key="style"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-4 gap-4"
            >
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreatePreview({ templateId: template.id as ProfileTemplate })}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center group ${
                    formData.templateId === template.id
                      ? 'border-cyan-500 bg-zinc-800'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${template.color} flex items-center justify-center text-xl shadow-lg`}>
                    {template.emoji}
                  </div>
                  <span className={`text-xs font-medium ${
                    formData.templateId === template.id ? 'text-white' : 'text-zinc-500'
                  }`}>
                    {template.name}
                  </span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="text"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Display Name</label>
                   <input 
                      type="text" 
                      value={formData.displayName}
                      onChange={(e) => handleCreatePreview({ displayName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Your Name"
                   />
                </div>
                <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tagline</label>
                   <input 
                      type="text" 
                      value={formData.tagline}
                      onChange={(e) => handleCreatePreview({ tagline: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Ultra Runner | Trail Enthusiast"
                   />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
