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
  Cell,
  ComposedChart
} from 'recharts';

interface ActivityChartsProps {
  stream: any;
  unit: 'metric' | 'imperial';
}

export default function ActivityCharts({ stream, unit }: ActivityChartsProps) {
  if (!stream) return null;

  // 1. Prepare Main Chart Data (HR / Speed / Altitude)
  const mainChartData = stream.time.map((t: number, i: number) => ({
    time: t,
    heartrate: stream.heartrate ? stream.heartrate[i] : null,
    velocity: stream.velocitySmooth ? (stream.velocitySmooth[i] * (unit === 'imperial' ? 2.23694 : 3.6)) : null,
    altitude: stream.altitude ? stream.altitude[i] : null,
  }));

  // 2. Prepare Pace Splits from stream data
  // We'll calculate splits based on the requested unit (km or mile)
  const splitSize = 1000; // default to 1km in meters
  const splits: { name: string; pace: number; hr: number }[] = [];
  
  if (stream.distance && stream.time) {
    let currentSplitDistance = 0;
    let lastSplitIndex = 0;
    let splitCount = 1;

    for (let i = 0; i < stream.distance.length; i++) {
        const d = stream.distance[i];
        if (d - currentSplitDistance >= splitSize) {
            const timeDiff = stream.time[i] - stream.time[lastSplitIndex];
            const distDiff = d - currentSplitDistance;
            
            // Pace in min/km or min/mile
            const paceValue = (timeDiff / 60) / (distDiff / (unit === 'imperial' ? 1609.34 : 1000));
            
            // Avg HR for this split
            let avgHr = 0;
            if (stream.heartrate) {
                const hrSlice = stream.heartrate.slice(lastSplitIndex, i + 1);
                avgHr = hrSlice.reduce((a: number, b: number) => a + b, 0) / hrSlice.length;
            }

            splits.push({
                name: `Spl ${splitCount++}`,
                pace: paceValue,
                hr: avgHr || 0
            });

            currentSplitDistance = d;
            lastSplitIndex = i;
        }
    }
    
    // Add final partial split if there's remaining distance or it's a short activity
    if (stream.distance.length > 0 && splits.length === 0) {
        const lastIndex = stream.distance.length - 1;
        const timeDiff = stream.time[lastIndex];
        const distDiff = stream.distance[lastIndex];
        const paceValue = (timeDiff / 60) / (distDiff / (unit === 'imperial' ? 1609.34 : 1000));
        let avgHr = 0;
        if (stream.heartrate) {
            avgHr = stream.heartrate.reduce((a: number, b: number) => a + b, 0) / stream.heartrate.length;
        }
        splits.push({
            name: 'Spl 1',
            pace: paceValue,
            hr: avgHr || 0
        });
    }
  }

  // 3. Prepare HR Distribution from stream data
  const hrDistributionMap: Record<string, number> = {};
  if (stream.heartrate) {
      stream.heartrate.forEach((hr: number) => {
          const bucket = Math.floor(hr / 10) * 10;
          const bucketKey = bucket.toString();
          hrDistributionMap[bucketKey] = (hrDistributionMap[bucketKey] || 0) + 1;
      });
  }
  const hrDistribution = Object.entries(hrDistributionMap)
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => Number(a.bucket) - Number(b.bucket));

  return (
    <div className="space-y-4">
      {/* Heart rate / Speed */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-6 h-[300px]">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Heart rate / Speed</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={mainChartData}>
             <defs>
              <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis yAxisId="left" orientation="left" stroke="#ef4444" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a' }}
               itemStyle={{ fontSize: '10px' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="heartrate" stroke="#ef4444" fill="url(#colorHr)" strokeWidth={1} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Altitude */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-6 h-[150px]">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Altitude</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={mainChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
            <Area type="monotone" dataKey="altitude" stroke="#52525b" fill="#27272a" strokeWidth={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Grid of Splits and Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pace Splits */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-4 h-[250px]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Pace splits</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={splits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis stroke="#3b82f6" fontSize={9} tickLine={false} axisLine={false} />
                    <Bar dataKey="pace" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heartrate Splits */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-4 h-[250px]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Heartrate splits</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={splits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis stroke="#ef4444" fontSize={9} tickLine={false} axisLine={false} />
                    <Bar dataKey="hr" fill="#991b1b" radius={[4, 4, 0, 0]} barSize={40}>
                        {splits.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === splits.length - 1 ? '#ef4444' : '#991b1b'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>

          {/* HR Distribution */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-4 h-[250px]">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Heart rate distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={hrDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="bucket" stroke="#52525b" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]}>
                        {hrDistribution.map((entry, index) => (
                             <Cell 
                                key={`cell-${index}`} 
                                fill={index > 4 ? '#ec4899' : '#831843'} 
                             />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}
