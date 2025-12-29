"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatsData {
  month: string;
  distance: number;
  elevation: number;
}

interface DistanceElevationChartProps {
  data: StatsData[];
}

export default function DistanceElevationChart({ data }: DistanceElevationChartProps) {
  return (
    <div className="w-full h-[250px] bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
      <h3 className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">Distance/Elevation gain</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#444" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="left"
            stroke="#444" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}mi`}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#444" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}ft`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", fontSize: "10px" }}
            itemStyle={{ padding: "0px" }}
          />
          <Bar yAxisId="left" dataKey="distance" name="Distance" fill="#4ade80" radius={[2, 2, 0, 0]} barSize={10} />
          <Line yAxisId="right" type="monotone" dataKey="elevation" name="Elevation" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
