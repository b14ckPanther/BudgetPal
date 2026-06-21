/**
 * Conservative recurring / subscription signal detection from confirmed expenses.
 */

import { AnalysisTransaction } from '../agent/filterTransactions';
import { getMerchantLabel } from '../agent/filterTransactions';
import { HierarchyCategory, getDescendantCategoryIds } from '../../lib/categoryHierarchy';
import type { ReportRecurringSignal } from './reportTypes';

function normalizeMerchant(name: string): string {
  return name.trim().toLowerCase();
}

export function detectRecurringSignals(
  expenseTxs: AnalysisTransaction[],
  categories: HierarchyCategory[]
): ReportRecurringSignal[] {
  const signals: ReportRecurringSignal[] = [];
  const subsRoot = categories.find(
    (c) => c.type === 'expense' && !c.parentCategoryId && c.name.toLowerCase() === 'subscriptions'
  );

  if (subsRoot) {
    const subsIds = new Set(getDescendantCategoryIds(subsRoot.id, categories));
    const subsTxs = expenseTxs.filter(
      (tx) =>
        (tx.categoryId && subsIds.has(tx.categoryId)) ||
        (tx.subcategoryId && subsIds.has(tx.subcategoryId))
    );
    const byMerchant = new Map<string, { total: number; count: number }>();
    for (const tx of subsTxs) {
      const m = getMerchantLabel(tx);
      const cur = byMerchant.get(m) || { total: 0, count: 0 };
      byMerchant.set(m, { total: cur.total + tx.amount, count: cur.count + 1 });
    }
    for (const [merchant, v] of byMerchant) {
      if (v.count >= 1) {
        signals.push({
          merchant,
          amount: Math.round((v.total / v.count) * 100) / 100,
          occurrences: v.count,
          note: 'Subscriptions category',
        });
      }
    }
  }

  const merchantBuckets = new Map<string, AnalysisTransaction[]>();
  for (const tx of expenseTxs) {
    const key = normalizeMerchant(getMerchantLabel(tx));
    if (key === 'unknown') continue;
    const list = merchantBuckets.get(key) || [];
    list.push(tx);
    merchantBuckets.set(key, list);
  }

  for (const [, txs] of merchantBuckets) {
    if (txs.length < 2) continue;
    const amounts = txs.map((t) => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const similar = amounts.every((a) => Math.abs(a - avg) / avg <= 0.05);
    if (!similar) continue;

    const dates = txs.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(Math.round((dates[i] - dates[i - 1]) / 86400000));
    }
    const monthlyLike = intervals.every((d) => d >= 25 && d <= 35);
    if (!monthlyLike) continue;

    const merchant = getMerchantLabel(txs[0]);
    if (signals.some((s) => normalizeMerchant(s.merchant) === normalizeMerchant(merchant))) {
      continue;
    }
    signals.push({
      merchant,
      amount: Math.round(avg * 100) / 100,
      occurrences: txs.length,
      note: 'Recurring monthly-like payments',
    });
  }

  return signals.slice(0, 6);
}
