"use client";

import React, { useState } from "react";
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
import { formatPeriodLabel, TimeGranularity } from "@/lib/date-utils";

interface MovingTimeData {
  period: string; // was month
  run: number;
  ride: number;
  other: number;
}

interface MovingTimeChartProps {
  data: MovingTimeData[];
  granularity?: TimeGranularity;
}

function MovingTimeChart({ data, granularity = 'month' }: MovingTimeChartProps) {
  const [params, setParams] = useQueryStates({
    from: parseAsIsoDateTime,
    to: parseAsIsoDateTime,
  });

  const handleBrushChange = (brushIndexes: { startIndex?: number; endIndex?: number } | null) => {
    if (!brushIndexes || brushIndexes.startIndex === undefined || brushIndexes.endIndex === undefined) {
      return;
    }

    const startPeriod = data[brushIndexes.startIndex]?.period;
    const endPeriod = data[brushIndexes.endIndex]?.period;

    if (startPeriod && endPeriod) {
      const fromDate = new Date(startPeriod);
      const toDate = new Date(endPeriod);
      
      // Adjust "to" date based on granularity
      if (granularity === 'month') {
        toDate.setMonth(toDate.getMonth() + 1);
        toDate.setDate(0);
      } else if (granularity === 'week') {
         toDate.setDate(toDate.getDate() + 7);
      } else if (granularity === 'day') {
         // end of day? mostly just selecting ranges, so inclusive
         toDate.setDate(toDate.getDate() + 1);
      } else if (granularity === 'hour') {
         toDate.setHours(toDate.getHours() + 1);
      }

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
          <span className="ml-2 text-xs text-cyan-500 font-normal normal-case">
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
            dataKey="period"
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatPeriodLabel(value, granularity)}
            minTickGap={30}
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
            labelFormatter={(label) => formatPeriodLabel(label, granularity)}
            formatter={(value: number | undefined, name?: string) => [`${((value || 0) / 3600).toFixed(1)}h`, name || '']}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
          <Bar
            dataKey="run"
            name="Run"
            fill="#06b6d4"
            stackId="a"
            radius={[0, 0, 0, 0]}
            onClick={(props: any) => {
               // Click handler for filtering - optional for now or keep logic similar to brush
            }}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            dataKey="ride"
            name="Ride"
            fill="#0891b2"
            stackId="a"
            radius={[0, 0, 0, 0]}
             onClick={(props: any) => {
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
            }}
            style={{ cursor: 'pointer' }}
          />
          <Brush
            dataKey="period"
            height={20}
            stroke="#06b6d4"
            fill="#18181b"
            onChange={handleBrushChange}
            tickFormatter={(value) => formatPeriodLabel(value, granularity)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default React.memo(MovingTimeChart);
