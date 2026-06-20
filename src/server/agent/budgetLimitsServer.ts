/**
 * Server-side budget limit persistence (mirrors client limits service).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

export async function updateOrCreateCategoryLimitServer(
  supabase: SupabaseClient<Database>,
  userId: string,
  budgetId: string,
  categoryId: string,
  limit: number
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('budget_category_limits')
    .select('id')
    .eq('budget_id', budgetId)
    .eq('category_id', categoryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    throw new Error('Failed to verify category limit');
  }

  if (existing) {
    const { error } = await supabase
      .from('budget_category_limits')
      .update({ monthly_limit: limit, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error('Failed to update category limit');
  } else {
    const { error } = await supabase.from('budget_category_limits').insert({
      user_id: userId,
      budget_id: budgetId,
      category_id: categoryId,
      monthly_limit: limit,
    });
    if (error) throw new Error('Failed to create category limit');
  }
}
