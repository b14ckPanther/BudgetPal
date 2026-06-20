/**
 * Deterministic date-range resolution for agent spending analysis.
 */

import { formatLocalDate, parseLocalDate } from '../../lib/budgets';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_8_months'
  | 'this_year'
  | 'custom'
  | 'semester';

export interface ResolvedDateRange {
  start: string;
  end: string;
  label: string;
}

export type DateRangeResolution =
  | { ok: true; range: ResolvedDateRange }
  | { ok: false; clarification: string };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  return startOfDay(start);
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function formatLabel(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const s = `${months[start.getMonth()]} ${start.getDate()}`;
  const e = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  if (formatLocalDate(start) === formatLocalDate(end)) return s;
  return `${s} – ${e}`;
}

export function resolveDateRange(
  preset: DateRangePreset,
  referenceDate: Date = new Date(),
  custom?: { start: string; end: string }
): DateRangeResolution {
  if (preset === 'semester') {
    return {
      ok: false,
      clarification:
        'I need a specific date range for semester spending. Try "last 3 months", "this year", or give explicit dates like "from Jan 1 to Jun 30".',
    };
  }

  const today = startOfDay(referenceDate);
  let start: Date;
  let end: Date;
  let label: string;

  switch (preset) {
    case 'today':
      start = today;
      end = endOfDay(today);
      label = 'Today';
      break;
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = y;
      end = endOfDay(y);
      label = 'Yesterday';
      break;
    }
    case 'this_week':
      start = startOfWeek(today);
      end = endOfWeek(today);
      label = 'This week';
      break;
    case 'last_week': {
      const lastWeekRef = new Date(today);
      lastWeekRef.setDate(lastWeekRef.getDate() - 7);
      start = startOfWeek(lastWeekRef);
      end = endOfWeek(lastWeekRef);
      label = 'Last week';
      break;
    }
    case 'this_month':
      start = startOfMonth(today);
      end = endOfMonth(today);
      label = 'This month';
      break;
    case 'last_month': {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = startOfMonth(lm);
      end = endOfMonth(lm);
      label = 'Last month';
      break;
    }
    case 'last_3_months':
      end = endOfDay(today);
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1, 0, 0, 0, 0);
      label = 'Last 3 months';
      break;
    case 'last_8_months':
      end = endOfDay(today);
      start = new Date(today.getFullYear(), today.getMonth() - 7, 1, 0, 0, 0, 0);
      label = 'Last 8 months';
      break;
    case 'this_year':
      start = startOfYear(today);
      end = endOfDay(today);
      label = 'This year';
      break;
    case 'custom': {
      if (!custom?.start || !custom?.end) {
        return {
          ok: false,
          clarification: 'Please provide a custom date range with start and end dates (YYYY-MM-DD).',
        };
      }
      start = parseLocalDate(custom.start);
      end = endOfDay(parseLocalDate(custom.end));
      if (start > end) {
        return { ok: false, clarification: 'The start date must be before the end date.' };
      }
      label = formatLabel(start, end);
      break;
    }
    default:
      return { ok: false, clarification: 'I could not determine the date range. Please be more specific.' };
  }

  return {
    ok: true,
    range: {
      start: formatLocalDate(start),
      end: formatLocalDate(end),
      label,
    },
  };
}

/** Returns the immediately preceding period of equal length. */
export function getPreviousComparablePeriod(
  start: string,
  end: string
): ResolvedDateRange {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  const lengthMs = endDate.getTime() - startDate.getTime() + 86400000;
  const prevEnd = new Date(startDate.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - lengthMs + 86400000);
  return {
    start: formatLocalDate(prevStart),
    end: formatLocalDate(prevEnd),
    label: formatLabel(prevStart, prevEnd),
  };
}
