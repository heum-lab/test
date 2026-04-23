import {
  endOfMonth,
  endOfYesterday,
  format,
  startOfMonth,
  startOfYesterday,
  subDays,
  subMonths,
} from 'date-fns';
import type { QuickDateKey } from '@/lib/constants';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export function resolveQuickDateRange(key: QuickDateKey): { start: string; end: string } {
  const now = new Date();
  switch (key) {
    case 'today':
      return { start: fmt(now), end: fmt(now) };
    case 'yesterday':
      return { start: fmt(startOfYesterday()), end: fmt(endOfYesterday()) };
    case 'last7':
      return { start: fmt(subDays(now, 7)), end: fmt(now) };
    case 'last1m':
      return { start: fmt(subMonths(now, 1)), end: fmt(now) };
    case 'last3m':
      return { start: fmt(subMonths(now, 3)), end: fmt(now) };
    case 'last6m':
      return { start: fmt(subMonths(now, 6)), end: fmt(now) };
    case 'last12m':
      return { start: fmt(subMonths(now, 12)), end: fmt(now) };
    case 'thisMonth':
      return { start: fmt(startOfMonth(now)), end: fmt(endOfMonth(now)) };
    case 'lastMonth': {
      const prev = subMonths(now, 1);
      return { start: fmt(startOfMonth(prev)), end: fmt(endOfMonth(prev)) };
    }
  }
}
