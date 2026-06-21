/**
 * Report type definitions and computed snapshot shapes.
 */

import type { ReportType } from '../../types/api';

export type ReportStatus = 'pending' | 'ready' | 'failed';

export interface ReportRange {
  start: string;
  end: string;
  label: string;
  isToDate: boolean;
}

export interface ReportCategoryBreakdownItem {
  categoryName: string;
  amount: number;
  percentage: number;
  limit: number;
  isOverBudget: boolean;
}

export interface ReportRecurringSignal {
  merchant: string;
  amount: number;
  occurrences: number;
  note: string;
}

export interface ReportTrendComparison {
  previousPeriodLabel: string;
  previousExpenses: number;
  previousIncome: number;
  expenseChangeAmount: number;
  expenseChangePercent: number;
}

export interface ComputedReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  safeToSpend: number | null;
  safeToSpendNote?: string;
  categoryBreakdown: ReportCategoryBreakdownItem[];
  overBudgetCategories: ReportCategoryBreakdownItem[];
  largestTransactions: {
    id: string;
    merchant: string;
    amount: number;
    date: string;
    categoryLabel: string;
  }[];
  topMerchants: {
    name: string;
    totalAmount: number;
    transactionCount: number;
  }[];
  recurringSignals: ReportRecurringSignal[];
  trend?: ReportTrendComparison;
  recommendations: string[];
  hasData: boolean;
  currency: string;
  computedAt: string;
}

export interface ComputedReport {
  type: ReportType;
  title: string;
  range: ReportRange;
  metrics: ComputedReportMetrics;
  summary: string;
  dataSnapshotHash: string;
}

export interface ReportGenerateParams {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  categoryTerms?: string[];
  merchantTerms?: string[];
  comparePrevious?: boolean;
  includePdf?: boolean;
  idempotencyKey: string;
}
