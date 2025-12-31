'use client';

import { WeeklyFormData } from "@/app/actions/modular-profile";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface FormCurveProps {
  data: WeeklyFormData[];
}

function getTrend(data: WeeklyFormData[]): 'up' | 'down' | 'stable' {
  if (data.length < 3) return 'stable';
  
  const recent = data.slice(-3);
  const older = data.slice(-6, -3);
  
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, w) => sum + w.totalMiles, 0) / recent.length;
  const olderAvg = older.reduce((sum, w) => sum + w.totalMiles, 0) / older.length;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    default: return 'text-zinc-400';
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up': return TrendingUp;
    case 'down': return TrendingDown;
    default: return Minus;
  }
}

export function FormCurve({ data }: FormCurveProps) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 h-full flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Not enough data for form curve</p>
      </div>
    );
  }

  const maxMiles = Math.max(...data.map(d => d.totalMiles), 1);
  const totalMiles = data.reduce((sum, d) => sum + d.totalMiles, 0);
  const avgMiles = data.length > 0 ? totalMiles / data.length : 0;
  const trend = getTrend(data);
  const TrendIcon = getTrendIcon(trend);

  // Get this week vs last week
  const thisWeek = data[data.length - 1];
  const lastWeek = data[data.length - 2];
  const weekChange = thisWeek && lastWeek 
    ? ((thisWeek.totalMiles - lastWeek.totalMiles) / (lastWeek.totalMiles || 1)) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Training Form</h3>
        <div className={`flex items-center gap-1 text-xs font-bold ${getTrendColor(trend)}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-black text-white">{avgMiles.toFixed(1)}</div>
          <div className="text-[10px] uppercase text-zinc-500">Avg mi/wk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-white">{thisWeek?.totalMiles || 0}</div>
          <div className="text-[10px] uppercase text-zinc-500">This Week</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-black ${weekChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(0)}%
          </div>
          <div className="text-[10px] uppercase text-zinc-500">vs Last</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex-1 flex items-end gap-1 min-h-[80px]">
        {data.map((week, index) => {
          const height = (week.totalMiles / maxMiles) * 100;
          const isThisWeek = index === data.length - 1;
          
          return (
            <motion.div
              key={week.weekStart}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 5)}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`flex-1 rounded-t transition-colors ${
                isThisWeek 
                  ? 'bg-gradient-to-t from-cyan-600 to-cyan-400' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
              title={`Week of ${week.weekStart}: ${week.totalMiles} mi`}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
        <span>{data[0]?.weekStart ? new Date(data[0].weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>Now</span>
      </div>
    </motion.div>
  );
}
