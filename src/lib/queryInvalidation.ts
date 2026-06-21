/**
 * Targeted TanStack Query invalidation after mutations.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useBudgetQueries';

export function invalidateAfterTransactionChange(
  queryClient: QueryClient,
  budgetId?: string | null
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
  queryClient.invalidateQueries({ queryKey: queryKeys.recentTransactions });
  queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
  if (budgetId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.limits(budgetId) });
  }
}

export function invalidateAfterAgentConfirm(
  queryClient: QueryClient,
  budgetId?: string | null
): void {
  invalidateAfterTransactionChange(queryClient, budgetId);
}

export function invalidateAfterBudgetLimitChange(
  queryClient: QueryClient,
  budgetId: string
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.limits(budgetId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
}

export function invalidateAfterClearHistory(_queryClient: QueryClient): void {
  // Chat history is local state; financial queries are unchanged.
}

export function invalidateAfterReportGenerate(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['reports'] });
}
