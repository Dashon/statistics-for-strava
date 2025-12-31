'use client';

import { ActivityCalendar, type Activity } from 'react-activity-calendar';
import { useMemo } from 'react';

interface ConsistencyCalendarProps {
  data: { date: string, movingTime: number }[];
}

export function ConsistencyCalendar({ data }: ConsistencyCalendarProps) {
  const calendarData = useMemo(() => {
    // 1. Aggregate by date
    const dailyMap = new Map<string, number>();
    
    // Initialize last 365 days with 0? No, the component handles gaps usually, 
    // but better to provide full range if we want strict control.
    // Actually, react-activity-calendar autofills gaps if we provide start/end range or just sparse data.
    // We'll just aggregate what we have.
    
    data.forEach(d => {
       const curr = dailyMap.get(d.date) || 0;
       dailyMap.set(d.date, curr + d.movingTime);
    });
    
    const dates = Array.from(dailyMap.keys()).sort();
    if (dates.length === 0) return [];

    // Generate full year range for better visual?
    // Let's just map the entries we have and let the component fill the rest relative to "today".
    
    // We need to transform to { date, count, level }
    // We'll determine level based on duration (minutes)
    const processed: Activity[] = [];
    
    // We should ideally generate a list of all days in the past year to ensure correct visualization
    // if the library expects it. But usually it takes a list.
    
    const today = new Date();
    const start = new Date();
    start.setFullYear(today.getFullYear() - 1);
    
    for (let d = start; d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const seconds = dailyMap.get(dateStr) || 0;
        const minutes = Math.round(seconds / 60);
        
        let level = 0;
        if (minutes > 0) level = 1;
        if (minutes > 30) level = 2;
        if (minutes > 60) level = 3;
        if (minutes > 120) level = 4;
        
        processed.push({
            date: dateStr,
            count: minutes,
            level: level as any // generic casting just in case
        });
    }
    
    return processed;
  }, [data]);

  const theme = {
    light: ['#18181b', '#cffafe', '#a5f3fc', '#67e8f9', '#0891b2'], // zinc-900 to cyan-600
    dark: ['#27272a', '#083344', '#155e75', '#0e7490', '#0891b2'], // zinc-800 to cyan-600 range
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center py-4">
      <ActivityCalendar
        data={calendarData}
        theme={theme}
        labels={{
            legend: {
                less: 'Less',
                more: 'More'
            },
            months: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ],
            totalCount: '{{count}} minutes of training in the last year'
        }}
        blockSize={12}
        blockMargin={4}
        fontSize={12}
        showWeekdayLabels
      />
    </div>
  );
}
