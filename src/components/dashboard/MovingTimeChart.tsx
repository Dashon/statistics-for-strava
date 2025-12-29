"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";
import { useQueryStates, parseAsIsoDateTime } from "nuqs";
import { formatTimeRange } from "@/lib/url-params";

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
  const [params, setParams] = useQueryStates({
    from: parseAsIsoDateTime,
    to: parseAsIsoDateTime,
  });

  const handleBrushChange = (brushIndexes: { startIndex?: number; endIndex?: number } | null) => {
    if (!brushIndexes || brushIndexes.startIndex === undefined || brushIndexes.endIndex === undefined) {
      return;
    }

    const startMonth = data[brushIndexes.startIndex]?.month;
    const endMonth = data[brushIndexes.endIndex]?.month;

    if (startMonth && endMonth) {
      const fromDate = new Date(`${startMonth}-01`);
      const toDate = new Date(`${endMonth}-01`);
      toDate.setMonth(toDate.getMonth() + 1);
      toDate.setDate(0);

      setParams({
        from: fromDate,
        to: toDate,
      });
    }
  };

  return (
    <div className="w-full h-[350px] bg-zinc-900/50 p-4 rounded-lg min-w-0">
      <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider">
        Moving time
        {params.from && params.to && (
          <span className="ml-2 text-xs text-orange-500 font-normal normal-case">
            ({formatTimeRange(params.from, params.to)})
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 25,
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
          <Bar
            dataKey="run"
            name="Run"
            fill="#ea580c"
            stackId="a"
            radius={[0, 0, 0, 0]}
            onClick={(props: any) => {
              const { month } = props.payload;
              const monthDate = new Date(`${month}-01`);
              const endDate = new Date(monthDate);
              endDate.setMonth(endDate.getMonth() + 1);
              endDate.setDate(0);
              setParams({ from: monthDate, to: endDate });
            }}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            dataKey="ride"
            name="Ride"
            fill="#9a3412"
            stackId="a"
            radius={[0, 0, 0, 0]}
            onClick={(props: any) => {
              const { month } = props.payload;
              const monthDate = new Date(`${month}-01`);
              const endDate = new Date(monthDate);
              endDate.setMonth(endDate.getMonth() + 1);
              endDate.setDate(0);
              setParams({ from: monthDate, to: endDate });
            }}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            dataKey="other"
            name="Other"
            fill="#444"
            stackId="a"
            radius={[2, 2, 0, 0]}
            onClick={(props: any) => {
              const { month } = props.payload;
              const monthDate = new Date(`${month}-01`);
              const endDate = new Date(monthDate);
              endDate.setMonth(endDate.getMonth() + 1);
              endDate.setDate(0);
              setParams({ from: monthDate, to: endDate });
            }}
            style={{ cursor: 'pointer' }}
          />
          <Brush
            dataKey="month"
            height={20}
            stroke="#ea580c"
            fill="#18181b"
            onChange={handleBrushChange}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
