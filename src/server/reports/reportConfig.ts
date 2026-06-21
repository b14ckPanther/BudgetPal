/**
 * Report export configuration (server-only).
 */

export const REPORT_STORAGE_BUCKET = 'report-exports';

export const REPORT_AI_MODEL = process.env.REPORT_AI_MODEL?.trim() || 'gpt-4o-mini';

/** Pending reports older than this are treated as stale and failed safely. */
export const STALE_PENDING_MS = 5 * 60 * 1000;

export function reportStoragePath(userId: string, reportId: string): string {
  return `${userId}/${reportId}.pdf`;
}
