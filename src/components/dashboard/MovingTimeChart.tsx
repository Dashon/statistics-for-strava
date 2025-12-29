"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MovingTimeData {
  month: string;
  run: number;
  ride: number;
  other: number;
}

interface MovingTimeChartProps {
  data: MovingTimeData[];
}

export default function MovingTimeChart({ data }: MovingTimeChartProps) {
  return (
    <div className="w-full h-[300px] bg-zinc-900/50 p-4 rounded-lg">
      <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider">Moving time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 3600).toFixed(0)}h`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
            itemStyle={{ color: "#fff" }}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            formatter={(value: number | undefined) => [`${((value || 0) / 3600).toFixed(1)}h`, ""]}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
          <Bar dataKey="run" name="Run" fill="#ea580c" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="ride" name="Ride" fill="#9a3412" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="other" name="Other" fill="#444" stackId="a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
