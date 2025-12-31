'use client';

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

interface CountryFlagsProps {
  countries: { countryCode: string; activityCount: number }[];
}

/**
 * CountryFlags - Display flags of countries the athlete has run in
 * 
 * Scaling behavior:
 * - 1-2 countries: Large hero-style flags
 * - 3-6 countries: Medium grid
 * - 7+ countries: Compact cloud
 */
export function CountryFlags({ countries }: CountryFlagsProps) {
  if (!countries || countries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3 p-8">
        <Globe className="w-10 h-10 opacity-30" />
        <p className="text-sm text-center">No country data yet</p>
      </div>
    );
  }

  const count = countries.length;
  
  // Determine sizing based on country count
  const getFlagSize = () => {
    if (count <= 2) return 'w-24 h-16'; // Large
    if (count <= 6) return 'w-16 h-12'; // Medium
    return 'w-12 h-8'; // Compact
  };

  const getGridCols = () => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-4';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4 sm:grid-cols-6';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-black italic uppercase tracking-wider text-xl text-cyan-500">
          <Globe className="w-5 h-5" /> Countries
        </h3>
        <span className="text-xs font-mono text-zinc-500">
          {count} {count === 1 ? 'country' : 'countries'}
        </span>
      </div>

      {/* Flags Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`grid ${getGridCols()} gap-4 justify-items-center`}>
          {countries.map((country, index) => (
            <motion.div
              key={country.countryCode}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative group"
            >
              {/* Flag Image - Using flagcdn.com for SVG flags */}
              <img
                src={`https://flagcdn.com/${country.countryCode.toLowerCase()}.svg`}
                alt={country.countryCode}
                className={`${getFlagSize()} object-cover rounded-lg shadow-lg border border-white/10 group-hover:scale-110 transition-transform duration-300`}
              />
              
              {/* Activity Count Badge */}
              <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-cyan-500/50 rounded-full px-2 py-0.5 text-[10px] font-bold text-cyan-400 shadow-lg">
                {country.activityCount}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-zinc-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap border border-zinc-700">
                  {country.countryCode}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
