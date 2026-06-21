/**
 * Shared financial aggregation helpers for agent analysis and reports.
 */

import { AnalysisTransaction } from '../server/agent/filterTransactions';
import { getMerchantLabel } from '../server/agent/filterTransactions';
import { HierarchyCategory } from './categoryHierarchy';

export interface BreakdownItem {
  name: string;
  amount: number;
  percentage: number;
}

export function sumTransactionAmounts(txs: AnalysisTransaction[]): number {
  return txs.reduce((s, tx) => s + tx.amount, 0);
}

export function aggregateByCategory(
  txs: AnalysisTransaction[],
  categories: HierarchyCategory[]
): BreakdownItem[] {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();

  for (const tx of txs) {
    const label =
      (tx.subcategoryId && catMap.get(tx.subcategoryId)) ||
      (tx.categoryId && catMap.get(tx.categoryId)) ||
      'Uncategorized';
    totals.set(label, (totals.get(label) || 0) + tx.amount);
  }

  const total = sumTransactionAmounts(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function aggregateByMerchant(txs: AnalysisTransaction[]): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const tx of txs) {
    const label = getMerchantLabel(tx);
    totals.set(label, (totals.get(label) || 0) + tx.amount);
  }
  const total = sumTransactionAmounts(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function aggregateByParentCategory(
  txs: AnalysisTransaction[],
  categories: HierarchyCategory[]
): BreakdownItem[] {
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

  const total = sumTransactionAmounts(txs);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MerchantSummaryItem {
  name: string;
  totalAmount: number;
  transactionCount: number;
}

export function topMerchantsFromExpenses(
  txs: AnalysisTransaction[],
  limit = 8
): MerchantSummaryItem[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const tx of txs) {
    const name = getMerchantLabel(tx);
    const cur = map.get(name) || { total: 0, count: 0 };
    map.set(name, { total: cur.total + tx.amount, count: cur.count + 1 });
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, totalAmount: v.total, transactionCount: v.count }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

export interface LargestTransactionItem {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  categoryLabel: string;
}

export function largestExpenseTransactions(
  txs: AnalysisTransaction[],
  categories: HierarchyCategory[],
  limit = 5
): LargestTransactionItem[] {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  return [...txs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((tx) => {
      const sub = tx.subcategoryId ? catMap.get(tx.subcategoryId) : null;
      const parent = tx.categoryId ? catMap.get(tx.categoryId) : null;
      const categoryLabel = sub && parent && sub !== parent ? `${parent} · ${sub}` : sub || parent || 'Uncategorized';
      return {
        id: tx.id,
        merchant: getMerchantLabel(tx),
        amount: tx.amount,
        date: tx.date,
        categoryLabel,
      };
    });
}
