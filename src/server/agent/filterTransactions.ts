/**
 * Transaction filtering for agent analysis queries.
 */

import {
  buildParentMap,
  getTransactionCategoryAttribution,
} from '../../lib/categoryHierarchy';
import { parseLocalDate } from '../../lib/budgets';

export interface AnalysisTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  categoryId: string | null;
  subcategoryId: string | null;
  merchant: string | null;
  title: string | null;
}

export function isAnalyzableExpense(tx: AnalysisTransaction): boolean {
  return (
    tx.type === 'expense' &&
    tx.status === 'confirmed' &&
    !!tx.date
  );
}

/** Filter using a full category hierarchy parent map from user categories. */
export function filterWithCategoryMap(
  transactions: AnalysisTransaction[],
  options: {
    start: string;
    end: string;
    categoryIds?: string[];
    merchantTerms?: string[];
  },
  categories: { id: string; name?: string; type?: string; parentCategoryId?: string | null }[]
): AnalysisTransaction[] {
  const startDate = parseLocalDate(options.start);
  const endDate = parseLocalDate(options.end);
  endDate.setHours(23, 59, 59, 999);

  const parentMap = buildParentMap(
    categories.map((c) => ({
      id: c.id,
      name: c.name || '',
      type: c.type || 'expense',
      parentCategoryId: c.parentCategoryId ?? null,
    }))
  );

  const categorySet = new Set(options.categoryIds || []);

  return transactions.filter((tx) => {
    if (!isAnalyzableExpense(tx)) return false;
    const txDate = parseLocalDate(tx.date);
    if (txDate < startDate || txDate > endDate) return false;

    if (categorySet.size > 0) {
      const attributed = getTransactionCategoryAttribution(
        { categoryId: tx.categoryId, subcategoryId: tx.subcategoryId },
        parentMap
      );
      if (!attributed.some((id) => categorySet.has(id))) return false;
    }

    if (options.merchantTerms && options.merchantTerms.length > 0) {
      const haystack = `${tx.merchant || ''} ${tx.title || ''}`.toLowerCase();
      if (!options.merchantTerms.some((t) => haystack.includes(t.trim().toLowerCase()))) {
        return false;
      }
    }

    return true;
  });
}

export function getMerchantLabel(tx: AnalysisTransaction): string {
  const merchant = tx.merchant?.trim();
  if (merchant) return merchant;
  const title = tx.title?.trim();
  if (title) return title;
  return 'Unknown';
}
