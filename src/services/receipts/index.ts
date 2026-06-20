import { supabase } from '@/lib/supabase';
import { Receipt } from '@/types/api';
import { Database } from '@/types/database';
import { mapReceipt } from '../mapper';

export async function createReceiptRecord(receipt: Partial<Receipt>): Promise<Receipt> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    file_url: receipt.fileUrl || null,
    merchant: receipt.merchant || null,
    receipt_date: receipt.receiptDate || null,
    total_amount: receipt.totalAmount !== undefined ? receipt.totalAmount : null,
    currency: receipt.currency || 'ILS',
    extracted_items: (receipt.extractedItems || []) as any,
    confidence: receipt.confidence !== undefined ? receipt.confidence : null,
    status: receipt.status || 'pending_review',
  };

  const { data, error } = await supabase
    .from('receipts')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create receipt record');
  }

  return mapReceipt(data);
}

export async function updateReceiptStatus(
  id: string,
  status: 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted'
): Promise<Receipt> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['receipts']['Update'] = {
    status,
  };

  const { data, error } = await supabase
    .from('receipts')
    .update(dbUpdate)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update receipt status');
  }

  return mapReceipt(data);
}
