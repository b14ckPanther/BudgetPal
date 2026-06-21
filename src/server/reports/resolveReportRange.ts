/**
 * Resolves report date ranges with "to date" rules for current periods.
 */

import { formatLocalDate, getCycleRange, parseLocalDate } from '../../lib/budgets';
import { formatLabelRange } from './reportLabels';
import type { ReportRange } from './reportTypes';
import type { ReportType } from '../../types/api';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  return startOfDay(start);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export interface ResolveRangeInput {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  budgetCycleStartDay?: number | null;
  referenceDate?: Date;
}

export type ResolveRangeResult =
  | { ok: true; range: ReportRange }
  | { ok: false; error: string };

function resolveCustomRange(
  input: ResolveRangeInput,
  today: Date,
  todayStr: string
): ResolveRangeResult {
  if (!input.dateFrom || !input.dateTo) {
    return { ok: false, error: 'Please select a start and end date for this report.' };
  }
  const start = parseLocalDate(input.dateFrom);
  const end = parseLocalDate(input.dateTo);
  if (start > end) {
    return { ok: false, error: 'The start date must be before the end date.' };
  }
  const endCapped = end > today ? today : end;
  const isToDate =
    formatLocalDate(endCapped) === todayStr &&
    (input.type === 'trend' || input.type === 'custom');
  return {
    ok: true,
    range: {
      start: input.dateFrom,
      end: formatLocalDate(endCapped),
      label: formatLabelRange(start, endCapped),
      isToDate,
    },
  };
}

export function resolveReportRange(input: ResolveRangeInput): ResolveRangeResult {
  const today = startOfDay(input.referenceDate || new Date());
  const todayStr = formatLocalDate(today);

  if (
    (input.type === 'trend' || input.type === 'category' || input.type === 'merchant') &&
    !input.dateFrom &&
    !input.dateTo
  ) {
    const monthly = resolveReportRange({
      ...input,
      type: 'monthly',
    });
    if (!monthly.ok) return monthly;
    return monthly;
  }

  switch (input.type) {
    case 'weekly': {
      const start = startOfWeekMonday(today);
      return {
        ok: true,
        range: {
          start: formatLocalDate(start),
          end: todayStr,
          label: 'This week to date',
          isToDate: true,
        },
      };
    }
    case 'monthly': {
      if (input.budgetCycleStartDay) {
        const { startDate } = getCycleRange(today, input.budgetCycleStartDay);
        return {
          ok: true,
          range: {
            start: formatLocalDate(startDate),
            end: todayStr,
            label: 'Current budget cycle to date',
            isToDate: true,
          },
        };
      }
      const start = startOfMonth(today);
      return {
        ok: true,
        range: {
          start: formatLocalDate(start),
          end: todayStr,
          label: 'This month to date',
          isToDate: true,
        },
      };
    }
    case 'custom':
    case 'category':
    case 'merchant':
    case 'trend':
      return resolveCustomRange(input, today, todayStr);
    default:
      return { ok: false, error: 'Unsupported report type.' };
  }
}

/** Previous period of equal elapsed duration ending the day before range start. */
export function getPreviousPeriodToDate(range: ReportRange): ReportRange {
  const startDate = parseLocalDate(range.start);
  const endDate = parseLocalDate(range.end);
  const lengthDays =
    Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (lengthDays - 1));
  return {
    start: formatLocalDate(prevStart),
    end: formatLocalDate(prevEnd),
    label: formatLabelRange(prevStart, prevEnd),
    isToDate: false,
  };
}
