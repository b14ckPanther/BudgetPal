/**
 * Human-readable report period labels.
 */

import { formatLocalDate, parseLocalDate } from '../../lib/budgets';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatLabelRange(start: Date, end: Date): string {
  const s = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  const e = `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  if (formatLocalDate(start) === formatLocalDate(end)) {
    return `${s}, ${end.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${s} – ${e}`;
}

export function reportTitleForType(
  type: string,
  rangeLabel: string,
  categoryLabel?: string,
  merchantLabel?: string
): string {
  switch (type) {
    case 'weekly':
      return 'Weekly Report';
    case 'monthly':
      return 'Monthly Report';
    case 'custom':
      return 'Custom Report';
    case 'category':
      return categoryLabel ? `${categoryLabel} Report` : 'Category Report';
    case 'merchant':
      return merchantLabel ? `${merchantLabel} Report` : 'Merchant Report';
    case 'trend':
      return 'Spending Trend Report';
    default:
      return `Report · ${rangeLabel}`;
  }
}
