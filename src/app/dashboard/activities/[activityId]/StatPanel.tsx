import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatPanelProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  variant?: 'orange' | 'zinc' | 'red' | 'purple' | 'green' | 'transparent';
  className?: string;
  subValue?: string;
  size?: 'sm' | 'md' | 'lg' | 'title';
}

export default function StatPanel({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  variant = 'zinc',
  className = '',
  subValue,
  size = 'md'
}: StatPanelProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return 'bg-[#f97316] text-black border-none';
      case 'transparent':
        return 'bg-transparent border-zinc-800 text-zinc-400';
      case 'zinc':
        return 'bg-zinc-900 border-zinc-800 text-zinc-400';
      default:
        return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  const getValueSize = () => {
    switch (size) {
      case 'sm': return 'text-xl';
      case 'lg': return 'text-4xl';
      case 'title': return 'text-5xl';
      default: return 'text-3xl';
    }
  };

  const getLabelColor = () => {
    return variant === 'orange' ? 'text-black/60' : 'text-zinc-500';
  };

  const getValueColor = () => {
    return variant === 'orange' ? 'text-black' : 'text-white';
  };

  const getUnitColor = () => {
    return variant === 'orange' ? 'text-black/40' : 'text-zinc-600';
  };

  return (
    <div className={`p-4 transition-all ${getVariantStyles()} ${className} flex flex-col justify-center`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${getLabelColor()}`}>
            {label}
          </span>
          {Icon && <Icon className={`w-3 h-3 ${getLabelColor()}`} />}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`${getValueSize()} font-black tracking-tighter ${getValueColor()}`}>
            {value}
          </span>
          {unit && (
            <span className={`text-sm font-bold lowercase ${getUnitColor()}`}>
              {unit}
            </span>
          )}
        </div>
        {subValue && (
            <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${getLabelColor()}`}>
                {subValue}
            </div>
        )}
      </div>
    </div>
  );
}
