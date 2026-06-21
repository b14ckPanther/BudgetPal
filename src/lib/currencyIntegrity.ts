/**
 * Currency change integrity — block changes after meaningful financial data exists.
 */

import { supabase } from '@/lib/supabase';

export interface CurrencyChangeCheck {
  allowed: boolean;
  reasonKey?: string;
}

export async function canChangeBudgetCurrency(userId: string): Promise<CurrencyChangeCheck> {
  const { count: confirmedTxCount, error: txError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  if (txError) {
    return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
  }

  if ((confirmedTxCount || 0) > 0) {
    return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
  }

  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('monthly_income, starting_balance, savings_goal')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (budgetError) {
    return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
  }

  if (budget) {
    const income = Number(budget.monthly_income || 0);
    const starting = Number(budget.starting_balance || 0);
    const savings = Number(budget.savings_goal || 0);
    if (income > 0 || starting > 0 || savings > 0) {
      return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
    }
  }

  const { data: limits, error: limitsError } = await supabase
    .from('budget_category_limits')
    .select('monthly_limit')
    .eq('user_id', userId);

  if (limitsError) {
    return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
  }

  const hasLimits = (limits || []).some((row) => Number(row.monthly_limit || 0) > 0);
  if (hasLimits) {
    return { allowed: false, reasonKey: 'profileSettings.currencyChangeBlocked' };
  }

  return { allowed: true };
}
