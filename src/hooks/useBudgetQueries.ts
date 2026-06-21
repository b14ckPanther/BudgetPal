import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentProfile } from '@/services/profile';
import { getCurrentBudget, updateCurrentBudget } from '@/services/budgets';
import { getCategories } from '@/services/categories';
import { getBudgetCategoryLimits, updateOrCreateCategoryLimit } from '@/services/limits';
import {
  getRecentTransactions,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
} from '@/services/transactions';
import { calculateBudgetSummary, BudgetSummary } from '@/lib/budgets';
import { Transaction, Budget, Category } from '@/types/api';
import { invalidateAfterTransactionChange, invalidateAfterBudgetLimitChange } from '@/lib/queryInvalidation';
import { triggerBudgetAlertsAfterMutation } from '@/services/notifications/triggerAfterMutation';

// Query Keys
export const queryKeys = {
  profile: ['profile'] as const,
  currentBudget: ['current_budget'] as const,
  categories: ['categories'] as const,
  limits: (budgetId: string) => ['category_limits', budgetId] as const,
  transactions: ['transactions'] as const,
  recentTransactions: ['recent_transactions'] as const,
};

// 1. Profile Query
export function useCurrentProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => getCurrentProfile(),
    staleTime: 60_000,
  });
}

// 2. Budget Query
export function useCurrentBudget() {
  return useQuery({
    queryKey: queryKeys.currentBudget,
    queryFn: () => getCurrentBudget(),
    staleTime: 30_000,
  });
}

// 3. Categories Query
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => getCategories(),
    staleTime: 5 * 60_000,
  });
}

// 4. Category Limits Query
export function useBudgetCategoryLimits(budgetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.limits(budgetId || ''),
    queryFn: () => getBudgetCategoryLimits(budgetId || ''),
    enabled: !!budgetId,
  });
}

// 5. Transactions Query (All)
export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => getRecentTransactions(200),
  });
}

// 6. Recent Transactions Query
export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: queryKeys.recentTransactions,
    queryFn: () => getRecentTransactions(limit),
  });
}

// 7. Combined Budget Summary Query
export function useBudgetSummary(): {
  data: BudgetSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
} {
  const { data: budget, isLoading: isBudgetLoading, error: budgetError } = useCurrentBudget();
  const { data: transactions, isLoading: isTxLoading, error: txError } = useTransactions();
  const { data: categories, isLoading: isCatLoading, error: catError } = useCategories();
  const { data: limits, isLoading: isLimitsLoading, error: limitsError } = useBudgetCategoryLimits(budget?.id);

  const queryClient = useQueryClient();

  const isLoading = isBudgetLoading || isTxLoading || isCatLoading || (!!budget && isLimitsLoading);
  const isError = !!budgetError || !!txError || !!catError || !!limitsError;
  const error = budgetError || txError || catError || limitsError;

  let summaryData: BudgetSummary | undefined = undefined;
  if (!isLoading && !isError) {
    summaryData = calculateBudgetSummary(
      budget
        ? {
            cycleStartDay: budget.cycleStartDay,
            monthlyIncome: budget.monthlyIncome,
            currency: budget.currency,
            budgetStyle: budget.budgetStyle,
          }
        : null,
      (transactions || []).map((tx) => ({
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        date: tx.date,
        categoryId: tx.categoryId || null,
        subcategoryId: tx.subcategoryId || null,
      })),
      categories || [],
      limits || []
    );
  }

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    if (budget?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.limits(budget.id) });
    }
  };

  return {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// 8. Create Transaction Mutation
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { data: budget } = useCurrentBudget();

  return useMutation({
    mutationFn: (tx: Partial<Transaction>) => createTransaction(tx),
    onSuccess: () => {
      invalidateAfterTransactionChange(queryClient, budget?.id);
      void triggerBudgetAlertsAfterMutation(queryClient);
    },
  });
}

// 9. Update Transaction Mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { data: budget } = useCurrentBudget();

  return useMutation({
    mutationFn: (tx: Partial<Transaction> & { id: string }) => updateTransaction(tx),
    onSuccess: () => {
      invalidateAfterTransactionChange(queryClient, budget?.id);
      void triggerBudgetAlertsAfterMutation(queryClient);
    },
  });
}

// 10. Soft Delete Transaction Mutation
export function useSoftDeleteTransaction() {
  const queryClient = useQueryClient();
  const { data: budget } = useCurrentBudget();

  return useMutation({
    mutationFn: (id: string) => softDeleteTransaction(id),
    onSuccess: () => {
      invalidateAfterTransactionChange(queryClient, budget?.id);
    },
  });
}

// 11. Update Budget Mutation
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budget: Partial<Budget>) => updateCurrentBudget(budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
    },
  });
}

// 12. Update Category Limit Mutation
export function useUpdateCategoryLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, categoryId, limit }: { budgetId: string; categoryId: string; limit: number }) =>
      updateOrCreateCategoryLimit(budgetId, categoryId, limit),
    onSuccess: (_, variables) => {
      invalidateAfterBudgetLimitChange(queryClient, variables.budgetId);
    },
  });
}
