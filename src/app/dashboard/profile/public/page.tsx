'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyPublicProfile,
  updatePublicProfile,
  checkUsernameAvailable,
  type SocialLinks,
} from '@/app/actions/public-profile';
import { getMediaUploadUrl, updateProfileHero } from '@/app/actions/media';
import { generateProfileHero } from '@/app/actions/cinematic-profile';
import { handleSignOut } from '@/app/actions/auth';
import { 
  Sparkles, 
  Settings, 
  User, 
  Globe, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATES = [
  { id: 'runner', name: 'Runner', emoji: '🏃‍♂️', color: 'from-cyan-500 to-blue-600', desc: 'Bold, data-focused layout for serious mileage.' },
  { id: 'racer', name: 'Racer', emoji: '🏁', color: 'from-purple-500 to-pink-600', desc: 'Aggressive, high-contrast style for competitive spirits.' },
  { id: 'global', name: 'Global', emoji: '🌍', color: 'from-blue-500 to-cyan-600', desc: 'Clean, map-centric view for the world traveler.' },
  { id: 'minimal', name: 'Minimal', emoji: '✨', color: 'from-zinc-500 to-zinc-700', desc: 'Sophisticated, typography-first aesthetic.' },
];

export default function PublicProfileEditorPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [initialUsername, setInitialUsername] = useState<string>('');
  
  // Reference Images State
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  
  const posterInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    tagline: '',
    coverImageUrl: '',
    heroImageUrl: '',
    templateId: 'runner',
    isPublic: false,
    socialLinks: {
      instagram: '',
      twitter: '',
      strava: '',
      youtube: '',
    } as SocialLinks,
  });

  // Load existing profile and reference images
  useEffect(() => {
    async function init() {
      const [profile, imagesRes] = await Promise.all([
        getMyPublicProfile(),
        fetch('/api/reference-image').then(res => res.json())
      ]);

      if (profile) {
        setFormData({
          username: profile.username || '',
          displayName: profile.displayName || '',
          tagline: profile.tagline || '',
          coverImageUrl: profile.coverImageUrl || '',
          heroImageUrl: profile.heroImageUrl || '',
          templateId: profile.templateId || 'runner',
          isPublic: profile.isPublic || false,
          socialLinks: (profile.socialLinks as SocialLinks) || {
            instagram: '',
            twitter: '',
            strava: '',
            youtube: '',
          },
        });
        setInitialUsername(profile.username || '');
      }

      if (imagesRes.images) {
        setReferenceImages(imagesRes.images);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // Check username availability
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      if (formData.username === initialUsername) {
        setUsernameStatus('available');
        return;
      }
      setUsernameStatus('checking');
      const result = await checkUsernameAvailable(formData.username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePublicProfile({
        username: formData.username || undefined,
        displayName: formData.displayName || undefined,
        tagline: formData.tagline || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        isPublic: formData.isPublic,
        socialLinks: formData.socialLinks,
        templateId: formData.templateId,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    });
  };

  const handleGenerateHero = async () => {
    setIsGenerating(true);
    try {
      const result = await generateProfileHero();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (result.heroUrl) {
            setFormData(prev => ({ ...prev, heroImageUrl: result.heroUrl! }));
        }
      } else {
        setError(result.error || 'AI Generation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(true);
    setError(null);

    try {
        // 1. Get signed URL
        const ext = file.name.split('.').pop() || 'jpg';
        const { signedUrl, publicUrl, error } = await getMediaUploadUrl('heroes', ext);
        
        if (error || !signedUrl) throw new Error(error || 'Failed to get upload URL');

        // 2. Upload to Supabase Storage
        const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        // 3. Update Profile
        await updateProfileHero(publicUrl);
        setFormData(prev => ({ ...prev, heroImageUrl: publicUrl }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to upload poster');
    } finally {
        setIsUploadingPoster(false);
        if (posterInputRef.current) posterInputRef.current.value = '';
    }
  };

  const handleRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRef(true);
    setError(null);

    const data = new FormData();
    data.append('file', file);
    data.append('imageType', 'general');

    try {
      const res = await fetch('/api/reference-image', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();

      if (result.success) {
        setReferenceImages(prev => [
          ...prev, 
          { imageId: result.imageId, imageUrl: result.imageUrl, imageType: 'general' }
        ]);
      } else {
        setError(result.error || 'Failed to upload reference image');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setIsUploadingRef(false);
    }
  };

  const deleteRefImage = async (id: string) => {
    try {
      const res = await fetch(`/api/reference-image?imageId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReferenceImages(prev => prev.filter(img => img.imageId !== id));
      }
    } catch (err) {
        console.error("Delete failed", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-32">
      {/* Header with Sign Out */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">Dashboards &gt; Profile Settings</span>
        </div>
        <div className="flex items-center gap-4">
          <form action={handleSignOut}>
            <button className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest font-bold">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-cyan-500 font-bold tracking-widest uppercase text-xs mb-4">
             <Settings className="w-4 h-4" />
             Athlete Settings
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">
            Profile <span className="text-cyan-500">Command</span>
          </h1>
          <p className="text-zinc-400 max-w-xl text-lg">
            Master your digital presence. Configure your public ID and customize your profile aesthetics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls - Left 2 Cols */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Poster Control Center */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden p-8 shadow-2xl relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ImageIcon className="w-24 h-24 text-cyan-400" />
                </div>
                
                <h2 className="text-2xl font-black italic uppercase tracking-tight mb-4 flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-cyan-500" />
                    Profile Poster
                </h2>
                <p className="text-zinc-400 mb-8 max-w-md">
                    This is the main "Hero" image displayed at the top of your public profile.
                </p>

                {/* Current Poster Preview */}
                {formData.heroImageUrl && (
                    <div className="mb-8 w-full h-[200px] rounded-2xl overflow-hidden relative border border-zinc-700">
                        <img src={formData.heroImageUrl} className="w-full h-full object-cover" alt="Current Poster" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Current Active Poster</span>
                         </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-4">
                     <button 
                        onClick={handleGenerateHero}
                        disabled={isGenerating || isUploadingPoster}
                        className="px-6 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-3 border border-zinc-700"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                        )}
                        {isGenerating ? "Creating Art..." : "Generate with AI"}
                    </button>

                    <button 
                        onClick={() => posterInputRef.current?.click()}
                        disabled={isGenerating || isUploadingPoster}
                        className="px-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-cyan-500 hover:text-white transition-all flex items-center gap-3 shadow-xl shadow-white/5"
                    >
                        {isUploadingPoster ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5" />
                        )}
                        {isUploadingPoster ? "Uploading..." : "Upload Image"}
                    </button>
                    <input 
                        type="file" 
                        ref={posterInputRef} 
                        onChange={handlePosterUpload} 
                        className="hidden" 
                        accept="image/*" 
                    />
                    
                </div>
                {formData.username && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <Link 
                            href={`/athlete/${formData.username}`} 
                            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            View Live Profile <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Layout Mode Selection */}
            <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl">
               <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5 text-zinc-400" />
                    Profile Layout
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEMPLATES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, templateId: t.id }))}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${
                            formData.templateId === t.id 
                            ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10' 
                            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl shadow-lg`}>
                                {t.emoji}
                            </div>
                            {formData.templateId === t.id && (
                                <div className="bg-cyan-500 rounded-full p-1">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                        <h4 className="font-bold text-white mb-1 uppercase tracking-tight">{t.name} Mode</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
                    </button>
                  ))}
               </div>
            </div>


            {/* General Identity Form */}
            <form onSubmit={handleSubmit} className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-3xl p-8 space-y-8 shadow-xl">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-zinc-400" />
                    Public Identity
                  </h3>
                  
                  <div className="flex items-center gap-4 px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Visibility</span>
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                            formData.isPublic ? 'bg-cyan-500' : 'bg-zinc-700'
                        }`}
                    >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all transform ${
                            formData.isPublic ? 'translate-x-5' : ''
                        }`} />
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Unique Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-mono">/</span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="handle"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />}
                                {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                                {usernameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Display Name</label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Alex Walker"
                        />
                    </div>
               </div>

               {/* Tagline */}
               <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tagline</label>
                    <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="Ultra Runner | Dreaming of UTMB 🇫🇷"
                    />
               </div>

               <div className="pt-4 flex items-center justify-between">
                   <div className="flex gap-2">
                        {success && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                <Check className="w-4 h-4" /> Changes Saved
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </motion.div>
                        )}
                   </div>
                   <button
                        type="submit"
                        disabled={isPending || usernameStatus === 'taken'}
                        className="px-8 py-3 bg-zinc-100 text-black font-black rounded-xl hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-50"
                   >
                        {isPending ? "Syncing..." : "Update Settings"}
                   </button>
               </div>
            </form>
          </div>

          {/* Sidebar Area - Right Col */}
          <div className="space-y-8">
            
            {/* Reference Images Library */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan-500" />
                    AI Memories
                  </h3>
               </div>
               
               <p className="text-zinc-500 text-xs mb-6">
                 Upload high-quality race photos. The AI uses these to learn your likeness for customized generated art.
               </p>

               <div className="grid grid-cols-2 gap-3 mb-6">
                  {referenceImages.map((img) => (
                    <div key={img.imageId} className="relative aspect-square rounded-xl overflow-hidden group border border-zinc-800">
                        <img 
                            src={img.imageUrl} 
                            alt="Reference" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                        <button 
                            onClick={() => deleteRefImage(img.imageId)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  ))}
                  
                  {isUploadingRef && (
                    <div className="aspect-square rounded-xl bg-zinc-950 border border-zinc-800 border-dashed flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                    </div>
                  )}

                  <label className="aspect-square rounded-xl bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <Plus className="w-6 h-6 text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                    <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-400 uppercase tracking-widest">Add Photo</span>
                    <input type="file" className="hidden" onChange={handleRefImageUpload} accept="image/*" />
                  </label>
               </div>
            </div>

            {/* Social Links Panel */}
            <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                    Social Echo
                </h3>
                <div className="space-y-4">
                    {['instagram', 'twitter', 'youtube', 'strava'].map((p) => (
                        <div key={p} className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{p}</label>
                            <input 
                                type="text"
                                value={formData.socialLinks[p as keyof SocialLinks] || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    socialLinks: { ...prev.socialLinks, [p]: e.target.value }
                                }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                                placeholder={`@yourname`}
                            />
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

