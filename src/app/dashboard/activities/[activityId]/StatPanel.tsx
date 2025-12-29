import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatPanelProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  variant?: 'orange' | 'zinc' | 'red' | 'purple' | 'green';
  className?: string;
  subValue?: string;
}

export default function StatPanel({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  variant = 'zinc',
  className = '',
  subValue
}: StatPanelProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'red':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'purple':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'green':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-zinc-950 border-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className={`border rounded-2xl p-6 relative overflow-hidden group ${getVariantStyles()} ${className}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{value}</span>
          {unit && <span className="text-lg text-zinc-600 font-bold lowercase">{unit}</span>}
        </div>
        {subValue && (
            <div className="mt-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                {subValue}
            </div>
        )}
      </div>
      
      {/* Subtle background icon for Grafana feel */}
      {Icon && (
        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Icon className="w-24 h-24 stroke-[4]" />
        </div>
      )}
    </div>
  );
}
