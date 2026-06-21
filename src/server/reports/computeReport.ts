/**
 * Deterministic report computation from authenticated user data.
 */

import { createHash } from 'crypto';
import { calculateBudgetSummary, formatLocalDate, getCycleRange, parseLocalDate } from '../../lib/budgets';
import { resolveCategoryTerms, HierarchyCategory } from '../../lib/categoryHierarchy';
import {
  aggregateByParentCategory,
  largestExpenseTransactions,
  sumTransactionAmounts,
  topMerchantsFromExpenses,
} from '../../lib/financialAggregations';
import { filterWithCategoryMap, AnalysisTransaction } from '../agent/filterTransactions';
import { UserAgentContext } from '../agent/loadUserContext';
import { detectRecurringSignals } from './detectRecurring';
import { getPreviousPeriodToDate, resolveReportRange } from './resolveReportRange';
import { reportTitleForType } from './reportLabels';
import type { ComputedReport, ComputedReportMetrics, ReportGenerateParams } from './reportTypes';

function filterConfirmedIncome(
  transactions: AnalysisTransaction[],
  start: string,
  end: string
): AnalysisTransaction[] {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  endDate.setHours(23, 59, 59, 999);
  return transactions.filter((tx) => {
    if (tx.type !== 'income' || tx.status !== 'confirmed' || !tx.date) return false;
    const d = parseLocalDate(tx.date);
    return d >= startDate && d <= endDate;
  });
}

function buildCategoryBreakdownWithLimits(
  expenseTxs: AnalysisTransaction[],
  categories: HierarchyCategory[],
  limits: { categoryId: string; monthlyLimit: number }[]
): ComputedReportMetrics['categoryBreakdown'] {
  const parents = categories.filter((c) => c.type === 'expense' && !c.parentCategoryId);
  const breakdown = aggregateByParentCategory(expenseTxs, categories);
  const limitsMap = new Map(limits.map((l) => [l.categoryId, l.monthlyLimit]));
  const parentNameToId = new Map(parents.map((p) => [p.name, p.id]));

  return breakdown.map((item) => {
    const parentId = parentNameToId.get(item.name);
    const limit = parentId ? limitsMap.get(parentId) || 0 : 0;
    return {
      categoryName: item.name,
      amount: item.amount,
      percentage: item.percentage,
      limit,
      isOverBudget: limit > 0 && item.amount > limit,
    };
  });
}

function deterministicRecommendations(metrics: ComputedReportMetrics): string[] {
  const recs: string[] = [];
  if (metrics.overBudgetCategories.length > 0) {
    const names = metrics.overBudgetCategories.map((c) => c.categoryName).join(', ');
    recs.push(`Review spending in ${names}, which exceeded configured limits during this period.`);
  }
  if (metrics.netSavings < 0) {
    recs.push('Expenses exceeded income in this period. Consider trimming discretionary categories.');
  } else if (metrics.netSavings > 0) {
    recs.push('Income exceeded expenses. Consider directing surplus toward savings goals.');
  }
  if (metrics.topMerchants.length > 0 && metrics.topMerchants[0].totalAmount > metrics.totalExpenses * 0.25) {
    recs.push(`Your largest merchant (${metrics.topMerchants[0].name}) accounts for a significant share of spending.`);
  }
  if (recs.length === 0 && metrics.hasData) {
    recs.push('Continue tracking expenses to keep your budget picture accurate.');
  }
  return recs.slice(0, 3);
}

function snapshotHash(metrics: ComputedReportMetrics, range: { start: string; end: string }): string {
  return createHash('sha256')
    .update(JSON.stringify({ range, metrics: { ...metrics, computedAt: undefined } }))
    .digest('hex')
    .slice(0, 16);
}

export type ComputeReportResult =
  | { ok: true; report: ComputedReport }
  | { ok: false; noData: true; message: string }
  | { ok: false; error: string };

export function computeReport(
  ctx: UserAgentContext,
  params: Omit<ReportGenerateParams, 'idempotencyKey' | 'includePdf'>
): ComputeReportResult {
  const rangeRes = resolveReportRange({
    type: params.type,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    budgetCycleStartDay: ctx.budget?.cycleStartDay ?? null,
  });

  if (!rangeRes.ok) {
    return { ok: false, error: rangeRes.error };
  }

  const { range } = rangeRes;
  let categoryIds: string[] | undefined;
  let categoryFilterLabel: string | undefined;

  if (params.categoryId) {
    categoryIds = [params.categoryId];
    const cat = ctx.categories.find((c) => c.id === params.categoryId);
    categoryFilterLabel = cat?.name;
  } else if (params.categoryTerms?.length) {
    const catRes = resolveCategoryTerms(params.categoryTerms, ctx.categories);
    if (!catRes.ok) return { ok: false, error: catRes.clarification };
    categoryIds = catRes.categoryIds;
    categoryFilterLabel = catRes.label;
  }

  const expenseTxs = filterWithCategoryMap(
    ctx.transactions,
    {
      start: range.start,
      end: range.end,
      categoryIds,
      merchantTerms: params.merchantTerms?.length ? params.merchantTerms : undefined,
    },
    ctx.categories
  );

  const incomeTxs = filterConfirmedIncome(ctx.transactions, range.start, range.end);

  const totalExpenses = sumTransactionAmounts(expenseTxs);
  const totalIncome = sumTransactionAmounts(incomeTxs);
  const hasData = totalExpenses > 0 || totalIncome > 0;

  if (!hasData) {
    return {
      ok: false,
      noData: true,
      message: `No confirmed income or expenses found for ${range.label}. Add transactions or choose a different period.`,
    };
  }

  const categoryBreakdown = buildCategoryBreakdownWithLimits(
    expenseTxs,
    ctx.categories,
    ctx.limits
  );
  const overBudgetCategories = categoryBreakdown.filter((c) => c.isOverBudget);

  let safeToSpend: number | null = null;
  let safeToSpendNote: string | undefined;
  if (ctx.budget && ctx.limits.length > 0) {
    const today = new Date();
    const cycleSummary = calculateBudgetSummary(
      ctx.budget,
      ctx.transactions,
      ctx.categories,
      ctx.limits,
      today
    );
    const { startDate: cycleStartDate } = getCycleRange(today, ctx.budget.cycleStartDay);
    const rangeStart = parseLocalDate(range.start);
    const rangeEnd = parseLocalDate(range.end);
    const todayLocal = startOfDayLocal(today);
    const rangeIncludesToday = rangeEnd >= todayLocal && rangeStart <= todayLocal;
    const rangeOverlapsCycle =
      rangeEnd >= cycleStartDate && rangeStart <= parseLocalDate(formatLocalDate(todayLocal));

    if (rangeIncludesToday && rangeOverlapsCycle && cycleSummary.safeToSpend !== null) {
      safeToSpend = cycleSummary.safeToSpend;
    } else {
      safeToSpendNote =
        'Safe-to-spend applies to your current budget cycle and is shown when the report includes today.';
    }
  } else {
    safeToSpendNote = 'Configure category limits to activate safe-to-spend guidance.';
  }

  const comparePrevious = params.comparePrevious ?? params.type === 'trend';
  let trend: ComputedReportMetrics['trend'];
  if (comparePrevious) {
    const prev = getPreviousPeriodToDate(range);
    const prevExpenses = filterWithCategoryMap(
      ctx.transactions,
      {
        start: prev.start,
        end: prev.end,
        categoryIds,
        merchantTerms: params.merchantTerms?.length ? params.merchantTerms : undefined,
      },
      ctx.categories
    );
    const prevIncome = filterConfirmedIncome(ctx.transactions, prev.start, prev.end);
    const prevExpenseTotal = sumTransactionAmounts(prevExpenses);
    const prevIncomeTotal = sumTransactionAmounts(prevIncome);
    if (prevExpenseTotal > 0 || prevIncomeTotal > 0) {
      const changeAmount = totalExpenses - prevExpenseTotal;
      const changePercent =
        prevExpenseTotal > 0
          ? Math.round((changeAmount / prevExpenseTotal) * 100)
          : totalExpenses > 0
            ? 100
            : 0;
      trend = {
        previousPeriodLabel: prev.label,
        previousExpenses: prevExpenseTotal,
        previousIncome: prevIncomeTotal,
        expenseChangeAmount: changeAmount,
        expenseChangePercent: changePercent,
      };
    }
  }

  const metrics: ComputedReportMetrics = {
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    safeToSpend,
    safeToSpendNote,
    categoryBreakdown,
    overBudgetCategories,
    largestTransactions: largestExpenseTransactions(expenseTxs, ctx.categories, 5),
    topMerchants: topMerchantsFromExpenses(expenseTxs, 8),
    recurringSignals: detectRecurringSignals(expenseTxs, ctx.categories),
    trend,
    recommendations: [],
    hasData: true,
    currency: ctx.currency,
    computedAt: new Date().toISOString(),
  };

  metrics.recommendations = deterministicRecommendations(metrics);

  const title = reportTitleForType(
    params.type,
    range.label,
    categoryFilterLabel,
    params.merchantTerms?.[0]
  );

  const report: ComputedReport = {
    type: params.type,
    title,
    range,
    metrics,
    summary: '',
    dataSnapshotHash: snapshotHash(metrics, range),
  };

  return { ok: true, report };
}

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
