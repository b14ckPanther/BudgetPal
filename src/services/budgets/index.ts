import { supabase } from '@/lib/supabase';
import { Budget } from '@/types/api';
import { Database } from '@/types/database';
import { mapBudget } from '../mapper';

// ... rest of functions ...

export async function getCurrentBudget(): Promise<Budget | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapBudget(data);
}

export async function createInitialBudget(params: Partial<Budget> = {}): Promise<Budget> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { data: budgetId, error: rpcError } = await supabase.rpc('create_initial_budget_for_user', {
    target_user_id: user.id,
    p_name: params.name || 'Main Budget',
    p_currency: params.currency || 'ILS',
    p_cycle_start_day: params.cycleStartDay || 1,
    p_budget_style: params.budgetStyle || 'balanced',
  });

  if (rpcError || !budgetId) {
    throw new Error(rpcError?.message || 'Failed to create initial budget');
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch created budget');
  }

  return mapBudget(data);
}

export async function updateCurrentBudget(budget: Partial<Budget>): Promise<Budget> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const activeBudget = await getCurrentBudget();
  if (!activeBudget) throw new Error('No active budget found to update');

  const dbUpdate: Database['public']['Tables']['budgets']['Update'] = {};
  if (budget.name !== undefined) dbUpdate.name = budget.name;
  if (budget.currency !== undefined) dbUpdate.currency = budget.currency;
  if (budget.monthlyIncome !== undefined) dbUpdate.monthly_income = budget.monthlyIncome;
  if (budget.startingBalance !== undefined) dbUpdate.starting_balance = budget.startingBalance;
  if (budget.cycleStartDay !== undefined) dbUpdate.cycle_start_day = budget.cycleStartDay;
  if (budget.savingsGoal !== undefined) dbUpdate.savings_goal = budget.savingsGoal;
  if (budget.budgetStyle !== undefined) dbUpdate.budget_style = budget.budgetStyle;
  if (budget.isActive !== undefined) dbUpdate.is_active = budget.isActive;

  const { data, error } = await supabase
    .from('budgets')
    .update(dbUpdate)
    .eq('id', activeBudget.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update budget');
  }

  return mapBudget(data);
}
