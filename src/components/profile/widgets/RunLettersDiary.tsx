'use client';

import { ScrollText, ExternalLink, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  fullText?: string;
}

interface RunLettersDiaryProps {
  entries: DiaryEntry[];
  isOwner?: boolean;
}

export function RunLettersDiary({ entries, isOwner = false }: RunLettersDiaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

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
          <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
             {entries.length > 0 ? (
               <div className="space-y-3">
                  {entries.map((entry, index) => {
                    const isExpanded = expandedId === entry.id;
                    return (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div 
                              onClick={() => toggleExpand(entry.id)}
                              className={cn(
                                "group block p-4 rounded-lg bg-zinc-900 transition-all border relative cursor-pointer",
                                isExpanded 
                                    ? "border-cyan-500/50 bg-zinc-900/80 shadow-lg shadow-cyan-900/10" 
                                    : "border-zinc-800 hover:bg-zinc-800/90 hover:border-cyan-500/30"
                              )}
                            >
                               <div className="flex justify-between items-start mb-2">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest mb-1">
                                         {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <h4 className={cn(
                                          "font-bold text-lg leading-tight transition-colors font-serif italic pr-8",
                                          isExpanded ? "text-cyan-400" : "text-white group-hover:text-cyan-400"
                                      )}>
                                        "{entry.title}"
                                      </h4>
                                  </div>
                                  <div className="text-zinc-500 group-hover:text-cyan-500/50 transition-colors">
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                               </div>

                               <AnimatePresence mode='wait'>
                                    {isExpanded ? (
                                        <motion.div
                                            key="full"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 border-t border-zinc-800/50 mt-2">
                                                <div 
                                                    className="text-sm text-zinc-300 leading-relaxed font-serif prose prose-invert prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: entry.fullText || entry.excerpt }}
                                                />
                                                <div className="mt-4 flex justify-end">
                                                    <Link 
                                                        href={isOwner ? `/dashboard/activities/${entry.id}` : `/activity/${entry.id}`}
                                                        className="text-xs flex items-center gap-1 text-cyan-500 hover:text-cyan-300 transition-colors font-bold uppercase tracking-wider"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        View Full Activity <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.p 
                                            key="excerpt"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-zinc-400 leading-relaxed line-clamp-2 font-serif pl-2 border-l-2 border-zinc-800 group-hover:border-cyan-500/30 transition-colors"
                                        >
                                          {entry.excerpt.replace(/<[^>]*>?/gm, '')}
                                        </motion.p>
                                    )}
                               </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                  })}
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
