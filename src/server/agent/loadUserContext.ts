/**
 * Loads authenticated user context for agent missions.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { HierarchyCategory } from '../../lib/categoryHierarchy';
import { AnalysisTransaction } from './filterTransactions';

export interface UserAgentContext {
  userId: string;
  currency: string;
  preferredLanguage?: string | null;
  savingsGoal: number;
  categories: HierarchyCategory[];
  budget: {
    id: string;
    cycleStartDay: number;
    monthlyIncome: number;
    currency: string;
  } | null;
  limits: { categoryId: string; monthlyLimit: number }[];
  transactions: AnalysisTransaction[];
}

export async function loadUserContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  transactionDateFrom?: string
): Promise<UserAgentContext> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency, preferred_language')
    .eq('id', userId)
    .single();

  const { data: budgetRow } = await supabase
    .from('budgets')
    .select('id, cycle_start_day, monthly_income, currency, savings_goal')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name, type, parent_category_id')
    .eq('user_id', userId);

  const limits: { categoryId: string; monthlyLimit: number }[] = [];
  if (budgetRow?.id) {
    const { data: limitRows = [] } = await supabase
      .from('budget_category_limits')
      .select('category_id, monthly_limit')
      .eq('user_id', userId)
      .eq('budget_id', budgetRow.id);

    for (const row of limitRows || []) {
      limits.push({
        categoryId: row.category_id,
        monthlyLimit: Number(row.monthly_limit) || 0,
      });
    }
  }

  let txQuery = supabase
    .from('transactions')
    .select('id, amount, type, status, date, category_id, subcategory_id, merchant, title')
    .eq('user_id', userId)
    .neq('status', 'deleted');

  if (transactionDateFrom) {
    txQuery = txQuery.gte('date', transactionDateFrom);
  }

  const { data: txRows = [] } = await txQuery.order('date', { ascending: false });

  const transactions: AnalysisTransaction[] = (txRows || []).map((tx) => ({
    id: tx.id,
    amount: Number(tx.amount),
    type: tx.type,
    status: tx.status,
    date: tx.date,
    categoryId: tx.category_id,
    subcategoryId: tx.subcategory_id,
    merchant: tx.merchant,
    title: tx.title,
  }));

  return {
    userId,
    currency: profile?.currency || budgetRow?.currency || 'ILS',
    preferredLanguage: profile?.preferred_language ?? null,
    savingsGoal: budgetRow?.savings_goal ? Number(budgetRow.savings_goal) : 0,
    categories: (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentCategoryId: c.parent_category_id,
    })),
    budget: budgetRow
      ? {
          id: budgetRow.id,
          cycleStartDay: budgetRow.cycle_start_day,
          monthlyIncome: Number(budgetRow.monthly_income) || 0,
          currency: budgetRow.currency,
        }
      : null,
    limits,
    transactions,
  };
}
