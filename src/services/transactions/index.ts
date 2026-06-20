import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types/api';
import { Database } from '@/types/database';
import { mapTransaction } from '../mapper';

// ... rest of functions ...

export async function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories!category_id(name),
      subcategory:categories!subcategory_id(name)
    `)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((tx: any) => {
    const categoryName = tx.category?.name || 'Uncategorized';
    const subcategoryName = tx.subcategory?.name || undefined;
    return mapTransaction(tx, categoryName, subcategoryName);
  });
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories!category_id(name),
      subcategory:categories!subcategory_id(name)
    `)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((tx: any) => {
    const categoryName = tx.category?.name || 'Uncategorized';
    const subcategoryName = tx.subcategory?.name || undefined;
    return mapTransaction(tx, categoryName, subcategoryName);
  });
}

export async function createTransaction(tx: Partial<Transaction>): Promise<Transaction> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    amount: tx.amount || 0,
    currency: tx.currency || 'ILS',
    type: tx.type || 'expense',
    merchant: tx.merchant || null,
    title: tx.title || '',
    description: tx.description || null,
    category_id: tx.categoryId || null,
    subcategory_id: tx.subcategoryId || null,
    date: tx.date || new Date().toISOString().split('T')[0],
    source: tx.source || 'manual',
    confidence: tx.confidence !== undefined ? tx.confidence : null,
    status: tx.status || 'confirmed',
    receipt_id: tx.receiptId || null,
    voice_entry_id: tx.voiceEntryId || null,
    note: tx.note || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(dbInsert)
    .select(`
      *,
      category:categories!category_id(name),
      subcategory:categories!subcategory_id(name)
    `)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create transaction');
  }

  const categoryName = (data as any).category?.name || 'Uncategorized';
  const subcategoryName = (data as any).subcategory?.name || undefined;
  return mapTransaction(data, categoryName, subcategoryName);
}

export async function updateTransaction(tx: Partial<Transaction> & { id: string }): Promise<Transaction> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['transactions']['Update'] = {};
  if (tx.amount !== undefined) dbUpdate.amount = tx.amount;
  if (tx.currency !== undefined) dbUpdate.currency = tx.currency;
  if (tx.type !== undefined) dbUpdate.type = tx.type;
  if (tx.merchant !== undefined) dbUpdate.merchant = tx.merchant;
  if (tx.title !== undefined) dbUpdate.title = tx.title;
  if (tx.description !== undefined) dbUpdate.description = tx.description;
  if (tx.categoryId !== undefined) dbUpdate.category_id = tx.categoryId;
  if (tx.subcategoryId !== undefined) dbUpdate.subcategory_id = tx.subcategoryId;
  if (tx.date !== undefined) dbUpdate.date = tx.date;
  if (tx.source !== undefined) dbUpdate.source = tx.source;
  if (tx.confidence !== undefined) dbUpdate.confidence = tx.confidence;
  if (tx.status !== undefined) dbUpdate.status = tx.status;
  if (tx.receiptId !== undefined) dbUpdate.receipt_id = tx.receiptId;
  if (tx.voiceEntryId !== undefined) dbUpdate.voice_entry_id = tx.voiceEntryId;
  if (tx.note !== undefined) dbUpdate.note = tx.note;

  const { data, error } = await supabase
    .from('transactions')
    .update(dbUpdate)
    .eq('id', tx.id)
    .eq('user_id', user.id)
    .select(`
      *,
      category:categories!category_id(name),
      subcategory:categories!subcategory_id(name)
    `)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update transaction');
  }

  const categoryName = (data as any).category?.name || 'Uncategorized';
  const subcategoryName = (data as any).subcategory?.name || undefined;
  return mapTransaction(data, categoryName, subcategoryName);
}

export async function softDeleteTransaction(id: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['transactions']['Update'] = {
    status: 'deleted',
  };

  const { error } = await supabase
    .from('transactions')
    .update(dbUpdate)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message || 'Failed to delete transaction');
  }
}
