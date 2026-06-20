import { supabase } from '@/lib/supabase';
import { Category } from '@/types/api';
import { mapCategory } from '../mapper';

export async function getCategories(): Promise<Category[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  // Categories in API format: spent calculation is mapped to 0 initially
  // Frontend/activity page will combine transactions to calculate active monthly spend
  return data.map((item) => mapCategory(item, 0));
}

export async function createCategory(category: Partial<Category>): Promise<Category> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    name: category.name || '',
    type: category.type || 'expense',
    parent_category_id: category.parentCategoryId || null,
    monthly_limit: category.monthlyLimit || null,
    ai_created: category.aiCreated || false,
    is_default: category.isDefault || false,
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create category');
  }

  return mapCategory(data, 0);
}

export async function ensureDefaultCategories(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { error } = await supabase.rpc('create_default_categories_for_user', {
    target_user_id: user.id,
  });

  if (error) {
    throw new Error(error.message || 'Failed to seed default categories');
  }
}
