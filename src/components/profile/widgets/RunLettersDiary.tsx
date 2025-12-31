import { ScrollText, ExternalLink, Quote } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

interface RunLettersDiaryProps {
  entries: DiaryEntry[];
  isOwner?: boolean;
}

export function RunLettersDiary({ entries, isOwner = false }: RunLettersDiaryProps) {
  return (
    <div className="h-full flex flex-col gap-6">
       <div className="h-full bg-[#18181b] rounded-xl border border-cyan-500/20 overflow-hidden flex flex-col relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600" />
          <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-cyan-500/5 to-transparent flex items-center justify-between">
             <h3 className="flex items-center gap-2 font-black italic uppercase tracking-wider text-xl text-cyan-500">
                <ScrollText className="w-5 h-5" /> Run Letters
             </h3>
             {isOwner && (
               <Link href="/dashboard/run-letters" className="text-xs font-bold text-zinc-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">
                  View All
               </Link>
             )}
          </div>
          <div className="flex-1 overflow-auto p-2">
             {entries.length > 0 ? (
               <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link 
                          href={isOwner ? `/dashboard/activities/${entry.id}` : `/activity/${entry.id}`} 
                          className="group block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 transition-all border border-zinc-800 hover:border-cyan-500/30 relative"
                        >
                           <Quote className="absolute top-4 right-4 w-4 h-4 text-zinc-700 group-hover:text-cyan-500/50 transition-colors" />
                           <div className="mb-2">
                              <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest">
                                 {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                           </div>
                           <h4 className="font-bold text-white text-lg leading-tight group-hover:text-cyan-400 transition-colors mb-2 font-serif italic">
                             "{entry.title}"
                           </h4>
                           <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 font-serif pl-2 border-l-2 border-zinc-800 group-hover:border-cyan-500/30 transition-colors">
                              {entry.excerpt.replace(/<[^>]*>?/gm, '')}
                           </p>
                        </Link>
                    </motion.div>
                  ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 p-8 text-center">
                 <ScrollText className="w-8 h-8 opacity-20" />
                 <p className="text-sm italic">No open diary entries yet.</p>
                 <p className="text-xs text-zinc-600">Mark your Run Letters as "Public" to see them here.</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );
}
