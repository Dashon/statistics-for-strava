
import { startOfWeek, startOfMonth, format, parseISO, differenceInDays } from 'date-fns';

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

/**
 * Determine the best time granularity for a given date range
 */
export function getGranularity(startDate: Date, endDate: Date): TimeGranularity {
  const diffDays = differenceInDays(endDate, startDate);

  if (diffDays <= 2) return 'hour';
  if (diffDays <= 31) return 'day';
  if (diffDays <= 180) return 'week'; // ~6 months
  return 'month';
}

/**
 * Format a date string based on granularity
 */
export function formatPeriodLabel(dateStr: string, granularity: TimeGranularity): string {
  const date = new Date(dateStr);
  
  switch (granularity) {
    case 'hour':
      return format(date, 'ha'); // 2pm
    case 'day':
      return format(date, 'MMM d'); // Jan 5
    case 'week':
      return format(date, 'MMM d'); // Week of Jan 5
    case 'month':
      return format(date, 'MMM yyyy'); // Jan 2024
    default:
      return dateStr;
  }
}

/**
 * Generate a key for grouping activities based on granularity
 */
export function getDateKey(date: Date, granularity: TimeGranularity): string {
  switch (granularity) {
    case 'hour':
      return format(date, "yyyy-MM-dd'T'HH:00:00");
    case 'day':
      return format(date, 'yyyy-MM-dd');
    case 'week':
      return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'month':
      return format(startOfMonth(date), 'yyyy-MM-01');
  }
}
