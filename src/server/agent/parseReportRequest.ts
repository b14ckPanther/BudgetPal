/**
 * Lightweight report type parsing for agent generate_report intent.
 */

import type { ReportType } from '../../types/api';

export interface AgentReportParams {
  type: ReportType;
  categoryTerms?: string[];
  merchantTerms?: string[];
  comparePrevious?: boolean;
}

export function parseAgentReportParams(message: string): AgentReportParams {
  const lower = message.toLowerCase();

  if (lower.includes('week')) {
    return { type: 'weekly' };
  }
  if (lower.includes('trend') || lower.includes('compare')) {
    return { type: 'trend', comparePrevious: true };
  }
  if (lower.includes('merchant')) {
    return { type: 'merchant' };
  }

  const categoryHints = ['food', 'restaurant', 'car', 'transport', 'shopping', 'subscription'];
  for (const hint of categoryHints) {
    if (lower.includes(hint)) {
      return { type: 'category', categoryTerms: [hint] };
    }
  }

  return { type: 'monthly' };
}
