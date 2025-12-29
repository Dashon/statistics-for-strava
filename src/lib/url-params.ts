import { parseAsInteger, parseAsIsoDateTime, parseAsString, parseAsStringEnum } from 'nuqs';

export type TimeRange = 'now-6h' | 'now-12h' | 'now-24h' | 'now-7d' | 'now-30d' | 'now-90d' | 'now-1y';

export const urlParamsParsers = {
  from: parseAsIsoDateTime,
  to: parseAsIsoDateTime,
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(50),
  sortBy: parseAsString,
  sortOrder: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
  activityType: parseAsString,
  activityId: parseAsString,
  timezone: parseAsString.withDefault('browser'),
  range: parseAsStringEnum<TimeRange>([
    'now-6h',
    'now-12h',
    'now-24h',
    'now-7d',
    'now-30d',
    'now-90d',
    'now-1y',
  ]),
};

export function getTimeRangeFromParams(range?: TimeRange, from?: Date | null, to?: Date | null) {
  if (from && to) {
    return { from, to };
  }

  const now = new Date();
  const rangeMap: Record<TimeRange, () => { from: Date; to: Date }> = {
    'now-6h': () => ({ from: new Date(now.getTime() - 6 * 60 * 60 * 1000), to: now }),
    'now-12h': () => ({ from: new Date(now.getTime() - 12 * 60 * 60 * 1000), to: now }),
    'now-24h': () => ({ from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now }),
    'now-7d': () => ({ from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now }),
    'now-30d': () => ({ from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now }),
    'now-90d': () => ({ from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: now }),
    'now-1y': () => ({ from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), to: now }),
  };

  if (range && rangeMap[range]) {
    return rangeMap[range]();
  }

  // Default to last 30 days
  return rangeMap['now-30d']();
}

export function formatTimeRange(from: Date, to: Date): string {
  const now = new Date();
  const diffMs = to.getTime() - from.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Check if 'to' is approximately now (within 5 minutes)
  const isNow = Math.abs(now.getTime() - to.getTime()) < 5 * 60 * 1000;

  if (isNow) {
    if (diffHours <= 6) return 'Last 6 hours';
    if (diffHours <= 12) return 'Last 12 hours';
    if (diffHours <= 24) return 'Last 24 hours';
    if (diffDays <= 7) return 'Last 7 days';
    if (diffDays <= 30) return 'Last 30 days';
    if (diffDays <= 90) return 'Last 90 days';
    if (diffDays <= 365) return 'Last year';
  }

  // Custom range
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return `${formatDate(from)} - ${formatDate(to)}`;
}
