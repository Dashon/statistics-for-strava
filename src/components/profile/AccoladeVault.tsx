'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Medal, Upload, X, Loader2, Award, Trophy } from 'lucide-react';
import { getAccoladeUploadUrl, updateAccolades } from '@/app/actions/cinematic-profile';

interface Accolade {
  id: string;
  title: string;
  date: string;
  image: string;
  type: 'medal' | 'bib' | 'trophy' | 'certificate';
}

interface AccoladeVaultProps {
  accolades: Accolade[];
  isEditing?: boolean;
}

export function AccoladeVault({ accolades: initialAccolades, isEditing }: AccoladeVaultProps) {
  const [accolades, setAccolades] = useState<Accolade[]>(initialAccolades || []);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Accolade Form State
  const [newItem, setNewItem] = useState<{ title: string; date: string; type: string; file: File | null }>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'medal',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItem({ ...newItem, file: e.target.files[0] });
    }
  };

  const handleAddAccolade = async () => {
    if (!newItem.file || !newItem.title) return;

    setUploading(true);
    try {
      // 1. Get signed URL
      const extension = newItem.file.name.split('.').pop() || 'png';
      const result = await getAccoladeUploadUrl(extension);
      
      if (result.error || !result.signedUrl) {
        throw new Error(result.error || 'Failed to get upload URL');
      }

      // 2. Upload to Supabase using signed URL
      const uploadRes = await fetch(result.signedUrl, {
        method: 'PUT',
        body: newItem.file,
        headers: { 'Content-Type': newItem.file.type }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Create new accolade object
      const newAccolade: Accolade = {
        id: crypto.randomUUID(),
        title: newItem.title,
        date: newItem.date,
        image: result.publicUrl,
        type: newItem.type as any,
      };

      // 4. Update local state and DB
      const updatedList = [...accolades, newAccolade];
      setAccolades(updatedList);
      await updateAccolades(updatedList);
      
      // Reset form
      setIsAdding(false);
      setNewItem({ title: '', date: new Date().toISOString().split('T')[0], type: 'medal', file: null });

    } catch (error) {
      console.error('Failed to add accolade:', error);
      alert('Failed to upload accolade. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAccolade = async (id: string) => {
    if (!confirm('Are you sure you want to remove this accolade?')) return;
    const updatedList = accolades.filter(a => a.id !== id);
    setAccolades(updatedList);
    await updateAccolades(updatedList);
  };

  // 3D Tilt Effect Helper
  const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
      <div className={`group relative preserve-3d transition-transform duration-500 hover:rotate-y-12 hover:rotate-x-12 ${className}`}>
        {children}
      </div>
    );
  };

  return (
    <div className="w-full py-12">
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="text-3xl font-black italic uppercase text-white flex items-center gap-3 tracking-tighter">
          <Trophy className="w-8 h-8 text-yellow-500" />
          The Accolade Vault
        </h2>
        {isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-full transition-all font-bold text-sm border border-yellow-500/50"
          >
            <Plus className="w-4 h-4" /> Add Accolade
          </button>
        )}
      </div>

      {/* The Vault Shelf */}
      <div className="relative w-full overflow-x-auto pb-12 px-4 hide-scrollbar perspective-1000">
        <div className="flex gap-8 min-w-max px-8">
          
          {/* Add New Placeholder (Visible in Edit Mode if empty or always at start?) */}
          {isEditing && accolades.length === 0 && (
            <button 
               onClick={() => setIsAdding(true)}
               className="w-48 h-64 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-yellow-500/50 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:text-yellow-500 transition-colors group"
            >
               <div className="w-16 h-16 rounded-full bg-zinc-800 group-hover:bg-yellow-500/10 flex items-center justify-center transition-colors">
                  <Plus className="w-8 h-8" />
               </div>
               <span className="font-bold text-sm uppercase tracking-wider">Add First Award</span>
            </button>
          )}

          <AnimatePresence>
            {accolades.map((award, index) => (
              <motion.div
                key={award.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: index * 0.1 }}
                className="relative group/card"
              >
                  {/* Delete Button (Edit Mode) */}
                  {isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveAccolade(award.id); }}
                      className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* The Award Card */}
                  <div className="w-56 h-72 relative perspective-1000">
                     <div className="w-full h-full relative preserve-3d transition-transform duration-500 ease-out transform group-hover/card:rotate-y-12">
                        {/* Glass Case Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none rounded-2xl border border-white/5" />
                        
                        {/* Lighting Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-yellow-500/20 to-transparent blur-xl opacity-0 group-hover/card:opacity-50 transition-opacity rounded-2xl" />

                        {/* Image Container */}
                        <div className="w-full h-48 bg-zinc-900 rounded-t-2xl overflow-hidden relative border-b border-zinc-800">
                           <img 
                              src={award.image} 
                              alt={award.title} 
                              className="w-full h-full object-contain p-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                           />
                           {/* Spotlight effect inside box */}
                           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
                        </div>

                        {/* Plaque / Label */}
                        <div className="w-full h-24 bg-zinc-900 border-t border-white/5 rounded-b-2xl p-4 flex flex-col justify-center relative overflow-hidden">
                           {/* Metallic sheen */}
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000" />
                           
                           <h3 className="font-bold text-white text-sm uppercase tracking-wide leading-tight line-clamp-2">
                             {award.title}
                           </h3>
                           <p className="text-zinc-500 text-xs font-mono mt-1">
                             {new Date(award.date).getFullYear()}
                           </p>
                           <div className="absolute bottom-3 right-3">
                              {award.type === 'medal' && <Medal className="w-4 h-4 text-yellow-500" />}
                              {award.type === 'trophy' && <Trophy className="w-4 h-4 text-yellow-500" />}
                              {award.type === 'certificate' && <Award className="w-4 h-4 text-blue-400" />}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Reflection on the "Create" shelf floor */}
                  <div className="absolute -bottom-4 left-0 w-full h-8 bg-gradient-to-b from-white/5 to-transparent blur-md transform scale-y-[-1] opacity-30" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Accolade Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
               <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Add to Vault</h3>
                    <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    {/* Image Upload */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                        newItem.file ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                      }`}
                    >
                       <input 
                         ref={fileInputRef} 
                         type="file" 
                         accept="image/*" 
                         onChange={handleFileChange} 
                         className="hidden" 
                       />
                       {newItem.file ? (
                          <div className="text-center">
                             <img 
                               src={URL.createObjectURL(newItem.file)} 
                               alt="Preview" 
                               className="h-32 object-contain mx-auto mb-2 drop-shadow-lg"
                             />
                             <span className="text-xs text-yellow-500 font-bold">Click to change</span>
                          </div>
                       ) : (
                          <>
                             <Upload className="w-8 h-8 text-zinc-500" />
                             <span className="text-sm font-medium text-zinc-400">Upload Medal or Photo</span>
                          </>
                       )}
                    </div>

                    {/* Meta Data */}
                    <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Title</label>
                       <input
                          type="text"
                          value={newItem.title}
                          onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                          placeholder="Boston Marathon Finisher"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Date</label>
                          <input
                             type="date"
                             value={newItem.date}
                             onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Type</label>
                          <select
                             value={newItem.type}
                             onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                          >
                             <option value="medal">Medal</option>
                             <option value="bib">Bib</option>
                             <option value="trophy">Trophy</option>
                             <option value="certificate">Certificate</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <button
                    onClick={handleAddAccolade}
                    disabled={!newItem.file || !newItem.title || uploading}
                    className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add to Vault
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
