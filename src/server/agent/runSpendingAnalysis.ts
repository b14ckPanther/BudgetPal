/**
 * Executes spending analysis from a validated query spec and user context.
 */

import { resolveCategoryTerms, HierarchyCategory } from '../../lib/categoryHierarchy';
import { resolveDateRange, getPreviousComparablePeriod } from './dateRanges';
import { filterWithCategoryMap, getMerchantLabel, AnalysisTransaction } from './filterTransactions';
import { SpendingQuerySpec } from '../validation';

export interface SpendingBreakdownItem {
  name: string;
  amount: number;
  percentage: number;
}

export interface SpendingAnalysisResult {
  periodLabel: string;
  totalSpent: number;
  breakdown: SpendingBreakdownItem[];
  topItem?: { name: string; amount: number };
  trend?: {
    previousPeriodLabel: string;
    previousTotal: number;
    changeAmount: number;
    changePercent: number;
  };
  explanation: string;
  empty: boolean;
  suggestedPrompts: string[];
  categoryFilterLabel?: string;
}

function sumAmount(txs: AnalysisTransaction[]): number {
  return txs.reduce((s, tx) => s + tx.amount, 0);
}

function aggregateByCategory(
  txs: AnalysisTransaction[],
  categories: HierarchyCategory[]
): SpendingBreakdownItem[] {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();

  for (const tx of txs) {
    const label =
      (tx.subcategoryId && catMap.get(tx.subcategoryId)) ||
      (tx.categoryId && catMap.get(tx.categoryId)) ||
      'Uncategorized';
    totals.set(label, (totals.get(label) || 0) + tx.amount);
  }

  const total = sumAmount(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function aggregateByMerchant(txs: AnalysisTransaction[]): SpendingBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const tx of txs) {
    const label = getMerchantLabel(tx);
    totals.set(label, (totals.get(label) || 0) + tx.amount);
  }
  const total = sumAmount(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function aggregateByParentCategory(
  txs: AnalysisTransaction[],
  categories: HierarchyCategory[]
): SpendingBreakdownItem[] {
  const parents = categories.filter((c) => c.type === 'expense' && !c.parentCategoryId);
  const childToParent = new Map<string, string>();
  for (const c of categories) {
    if (c.parentCategoryId) childToParent.set(c.id, c.parentCategoryId);
  }

  const totals = new Map<string, number>();
  const parentNames = new Map(parents.map((p) => [p.id, p.name]));

  for (const tx of txs) {
    let parentId = tx.categoryId;
    if (tx.subcategoryId) {
      parentId = childToParent.get(tx.subcategoryId) || tx.categoryId;
    } else if (tx.categoryId && childToParent.has(tx.categoryId)) {
      parentId = childToParent.get(tx.categoryId) || tx.categoryId;
    }
    const name = (parentId && parentNames.get(parentId)) || 'Uncategorized';
    totals.set(name, (totals.get(name) || 0) + tx.amount);
  }

  const total = sumAmount(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type SpendingAnalysisOutcome =
  | { ok: true; result: SpendingAnalysisResult }
  | { ok: false; clarification: string };

export function runSpendingAnalysis(
  spec: SpendingQuerySpec,
  transactions: AnalysisTransaction[],
  categories: HierarchyCategory[],
  referenceDate: Date = new Date()
): SpendingAnalysisOutcome {
  const dateRes = resolveDateRange(
    spec.dateRangePreset,
    referenceDate,
    spec.customStart && spec.customEnd
      ? { start: spec.customStart, end: spec.customEnd }
      : undefined
  );

  if (!dateRes.ok) {
    return { ok: false, clarification: dateRes.clarification };
  }

  const { range } = dateRes;
  let categoryIds: string[] | undefined;
  let categoryFilterLabel: string | undefined;

  if (spec.categoryTerms.length > 0) {
    const catRes = resolveCategoryTerms(spec.categoryTerms, categories);
    if (!catRes.ok) return { ok: false, clarification: catRes.clarification };
    categoryIds = catRes.categoryIds;
    categoryFilterLabel = catRes.label;
  }

  const filtered = filterWithCategoryMap(
    transactions,
    {
      start: range.start,
      end: range.end,
      categoryIds,
      merchantTerms: spec.merchantTerms.length ? spec.merchantTerms : undefined,
    },
    categories
  );

  const totalSpent = sumAmount(filtered);
  const empty = filtered.length === 0;

  let breakdown: SpendingBreakdownItem[] = [];
  let explanation = '';
  const suggestedPrompts = [
    'Compare my food spending this month to last month',
    'Which merchants cost me the most?',
    'How can I save more this week?',
  ];

  if (empty) {
    explanation = categoryFilterLabel
      ? `No confirmed spending found for ${categoryFilterLabel} during ${range.label}.`
      : `No confirmed spending found during ${range.label}.`;
  } else {
    switch (spec.analysisType) {
      case 'merchant_breakdown':
        breakdown = aggregateByMerchant(filtered).slice(0, 8);
        explanation = `Your top merchants by spending during ${range.label}.`;
        break;
      case 'single_category':
      case 'category_breakdown':
        breakdown = aggregateByCategory(filtered, categories).slice(0, 8);
        explanation = categoryFilterLabel
          ? `${categoryFilterLabel} spending breakdown for ${range.label}.`
          : `Category breakdown for ${range.label}.`;
        break;
      case 'category_growth':
      case 'category_comparison':
      case 'top_categories':
      default:
        breakdown = aggregateByParentCategory(filtered, categories).slice(0, 8);
        if (spec.analysisType === 'top_categories' && breakdown.length > 0) {
          explanation = `Your highest spending category during ${range.label} is ${breakdown[0].name} at ${breakdown[0].percentage}% of tracked spending.`;
        } else {
          explanation = `Spending by parent category during ${range.label}.`;
        }
        break;
    }
  }

  let trend: SpendingAnalysisResult['trend'];
  if (spec.compareToPreviousPeriod && !empty) {
    const prev = getPreviousComparablePeriod(range.start, range.end);
    const prevFiltered = filterWithCategoryMap(
      transactions,
      {
        start: prev.start,
        end: prev.end,
        categoryIds,
        merchantTerms: spec.merchantTerms.length ? spec.merchantTerms : undefined,
      },
      categories
    );
    const prevTotal = sumAmount(prevFiltered);
    const changeAmount = totalSpent - prevTotal;
    const changePercent =
      prevTotal > 0 ? Math.round((changeAmount / prevTotal) * 100) : totalSpent > 0 ? 100 : 0;

    trend = {
      previousPeriodLabel: prev.label,
      previousTotal: prevTotal,
      changeAmount,
      changePercent,
    };

    if (spec.analysisType === 'category_comparison' && categoryFilterLabel) {
      explanation = `${categoryFilterLabel}: ${totalSpent.toFixed(0)} this period vs ${prevTotal.toFixed(0)} last period (${changePercent >= 0 ? '+' : ''}${changePercent}%).`;
    } else if (spec.analysisType === 'category_growth' && breakdown.length > 0) {
      explanation = `${breakdown[0].name} leads your spending during ${range.label}.`;
    }
  }

  const topItem = breakdown[0]
    ? { name: breakdown[0].name, amount: breakdown[0].amount }
    : undefined;

  return {
    ok: true,
    result: {
      periodLabel: range.label,
      totalSpent,
      breakdown,
      topItem,
      trend,
      explanation,
      empty,
      suggestedPrompts,
      categoryFilterLabel,
    },
  };
}
