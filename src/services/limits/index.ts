import { supabase } from '@/lib/supabase';

export interface BudgetCategoryLimit {
  id: string;
  userId: string;
  budgetId: string;
  categoryId: string;
  monthlyLimit: number;
}

export function mapCategoryLimit(dbLimit: any): BudgetCategoryLimit {
  return {
    id: dbLimit.id,
    userId: dbLimit.user_id,
    budgetId: dbLimit.budget_id,
    categoryId: dbLimit.category_id,
    monthlyLimit: Number(dbLimit.monthly_limit) || 0,
  };
}

export async function getBudgetCategoryLimits(budgetId: string): Promise<BudgetCategoryLimit[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('budget_category_limits')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('user_id', user.id);

  if (error || !data) {
    return [];
  }

  return data.map(mapCategoryLimit);
}

export async function updateOrCreateCategoryLimit(
  budgetId: string,
  categoryId: string,
  limit: number
): Promise<BudgetCategoryLimit> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  // Check if limit already exists
  const { data: existing, error: existingError } = await supabase
    .from('budget_category_limits')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('category_id', categoryId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('budget_category_limits')
      .update({ monthly_limit: limit, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update category limit');
    }
    return mapCategoryLimit(data);
  } else {
    // Insert
    const { data, error } = await supabase
      .from('budget_category_limits')
      .insert({
        user_id: user.id,
        budget_id: budgetId,
        category_id: categoryId,
        monthly_limit: limit,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create category limit');
    }
    return mapCategoryLimit(data);
  }
}
