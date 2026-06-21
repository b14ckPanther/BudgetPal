/**
 * Trigger local budget alerts after financial mutations.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useBudgetQueries';
import { calculateBudgetSummary } from '@/lib/budgets';
import { getCurrentProfile } from '@/services/profile';
import { getCurrentBudget } from '@/services/budgets';
import { getCategories } from '@/services/categories';
import { getBudgetCategoryLimits } from '@/services/limits';
import { getRecentTransactions } from '@/services/transactions';
import { evaluateBudgetAlertsAfterTransaction } from '@/services/notifications/budgetAlerts';
import { supabase } from '@/lib/supabase';

export async function triggerBudgetAlertsAfterMutation(queryClient: QueryClient): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await getCurrentProfile();
  const budget = await getCurrentBudget();
  if (!profile || !budget) return;

  const [transactions, categories, limits] = await Promise.all([
    getRecentTransactions(200),
    getCategories(),
    getBudgetCategoryLimits(budget.id),
  ]);

  const summary = calculateBudgetSummary(
    {
      cycleStartDay: budget.cycleStartDay,
      monthlyIncome: budget.monthlyIncome,
      currency: budget.currency,
      budgetStyle: budget.budgetStyle,
    },
    transactions.map((tx) => ({
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      date: tx.date,
      categoryId: tx.categoryId || null,
      subcategoryId: tx.subcategoryId || null,
    })),
    categories,
    limits
  );

  await evaluateBudgetAlertsAfterTransaction({
    userId: user.id,
    summary,
    budgetStyle: budget.budgetStyle,
    notificationsEnabled: profile.notificationsEnabled !== false,
  });

  void queryClient;
}
