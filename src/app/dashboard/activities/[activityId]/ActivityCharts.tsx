"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface ActivityChartsProps {
  stream: any;
  unit: 'metric' | 'imperial';
}

export default function ActivityCharts({ stream, unit }: ActivityChartsProps) {
  if (!stream) return null;

  // Prepare data for Heart Rate / Speed chart
  const mainChartData = stream.time.map((t: number, i: number) => ({
    time: t,
    heartrate: stream.heartrate ? stream.heartrate[i] : null,
    velocity: stream.velocitySmooth ? (stream.velocitySmooth[i] * (unit === 'imperial' ? 2.23694 : 3.6)) : null, // conversion to mph or km/h
    altitude: stream.altitude ? stream.altitude[i] : null,
  }));

  const formatPace = (mps: number) => {
    if (!mps || mps === 0) return "0:00";
    const paceUnit = unit === 'imperial' ? 1609.34 : 1000;
    const secondsPerUnit = paceUnit / mps;
    const min = Math.floor(secondsPerUnit / 60);
    const sec = Math.floor(secondsPerUnit % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Heart Rate & Speed Area Chart */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[400px]">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Heart rate / Speed</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mainChartData}>
            <defs>
              <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#ef4444" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#3b82f6" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="heartrate" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHr)" 
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="velocity" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Altitude Profile */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[200px]">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Altitude</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mainChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              stroke="#71717a"
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
               contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
               labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="altitude" 
              stroke="#71717a" 
              strokeWidth={1} 
              dot={false}
              fill="#27272a"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
