/**
 * BudgetPal — Date Formatting Helpers
 */

import { getAppIntlLocale, formatNumber } from './formatLocale';
import { t } from './i18n';

/**
 * Format a date as a relative string (Today, Yesterday, or formatted date).
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return t('dates.today');
  if (diff === 1) return t('dates.yesterday');
  if (diff < 7) return t('dates.daysAgo', { count: diff });
  return formatDate(d);
}

/**
 * Format a date as a short readable string.
 */
export function formatDate(date: Date | string, includeYear?: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(getAppIntlLocale(), {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

/**
 * Format a date range string.
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  return t('dates.range', { start: formatDate(start), end: formatDate(end) });
}

/**
 * Get the number of remaining days in a budget cycle.
 */
export function getRemainingDays(cycleEndDate: Date | string): number {
  const end = typeof cycleEndDate === 'string' ? new Date(cycleEndDate) : cycleEndDate;
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatRemainingDays(days: number): string {
  if (days === 0) return t('dates.remainingToday');
  if (days === 1) return t('dates.remainingOneDay');
  return t('dates.remainingDays', { count: formatNumber(days) });
}
