/**
 * BudgetPal — Date Formatting Helpers
 * Relative date labels and formatted date strings.
 */

/**
 * Format a date as a relative string (Today, Yesterday, or formatted date).
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(d);
}

/**
 * Format a date as a short readable string.
 * Example: "Jun 15" or "Jun 15, 2025"
 */
export function formatDate(date: Date | string, includeYear?: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();

  if (includeYear) {
    return `${month} ${day}, ${d.getFullYear()}`;
  }
  return `${month} ${day}`;
}

/**
 * Format a date range string.
 * Example: "Jun 1 - Jun 30"
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
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
