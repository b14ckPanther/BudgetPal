/**
 * Centralized Budget Style policy — thresholds and tone without changing math.
 */

import { BudgetStyle } from '@/types/api';
import { BudgetWarning } from '@/lib/budgets';

export interface BudgetStylePolicy {
  thresholds: number[];
  showGentleWarnings: boolean;
  tone: 'direct' | 'balanced' | 'relaxed';
}

const POLICIES: Record<BudgetStyle, BudgetStylePolicy> = {
  strict: {
    thresholds: [50, 70, 85, 100],
    showGentleWarnings: true,
    tone: 'direct',
  },
  balanced: {
    thresholds: [50, 75, 85, 100],
    showGentleWarnings: true,
    tone: 'balanced',
  },
  chill: {
    thresholds: [75, 90, 100],
    showGentleWarnings: false,
    tone: 'relaxed',
  },
};

export function getBudgetStylePolicy(style: BudgetStyle = 'balanced'): BudgetStylePolicy {
  return POLICIES[style] ?? POLICIES.balanced;
}

export type WarningSeverity = BudgetWarning['type'];

export function resolveWarningSeverity(
  percentage: number,
  style: BudgetStyle = 'balanced'
): WarningSeverity | null {
  const { thresholds } = getBudgetStylePolicy(style);
  const sorted = [...thresholds].sort((a, b) => b - a);

  if (percentage >= 100) return 'danger';
  for (const threshold of sorted) {
    if (threshold >= 100) continue;
    if (percentage >= threshold) {
      if (threshold >= 85) return 'strong';
      if (threshold >= 70) return 'attention';
      return 'gentle';
    }
  }
  return null;
}

export function highestCrossedThreshold(
  percentage: number,
  style: BudgetStyle = 'balanced'
): number | null {
  const { thresholds } = getBudgetStylePolicy(style);
  let highest: number | null = null;
  for (const t of thresholds) {
    if (percentage >= t && (highest === null || t > highest)) {
      highest = t;
    }
  }
  return highest;
}

export function warningLevelForCard(severity: WarningSeverity): 'info' | 'attention' | 'warning' | 'critical' {
  switch (severity) {
    case 'danger':
      return 'critical';
    case 'strong':
      return 'warning';
    case 'attention':
      return 'attention';
    default:
      return 'info';
  }
}
