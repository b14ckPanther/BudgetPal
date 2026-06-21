/**
 * Duplicate receipt warnings (merchant + amount + nearby date).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

export interface DuplicateWarning {
  transactionId: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
}

function normalizeMerchant(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function merchantsSimilar(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeMerchant(a || '');
  const right = normalizeMerchant(b || '');
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const leftWords = left.split(' ').filter((w) => w.length > 2);
  const rightWords = new Set(right.split(' ').filter((w) => w.length > 2));
  const overlap = leftWords.filter((w) => rightWords.has(w)).length;
  return overlap >= 1 && overlap >= Math.min(leftWords.length, rightWords.size) * 0.5;
}

function addDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split('T')[0];
}

export async function detectDuplicateReceipt(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: {
    merchant: string | null;
    amount: number | null;
    currency: string;
    receiptDate: string | null;
    today: string;
  }
): Promise<DuplicateWarning | null> {
  if (input.amount == null || input.amount <= 0) return null;

  const anchorDate = input.receiptDate || input.today;
  const from = addDays(anchorDate, -3);
  const to = addDays(anchorDate, 3);

  const { data: candidates } = await supabase
    .from('transactions')
    .select('id, merchant, title, amount, currency, date')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('date', from)
    .lte('date', to)
    .gte('amount', input.amount - 0.01)
    .lte('amount', input.amount + 0.01);

  for (const tx of candidates || []) {
    const label = tx.merchant || tx.title;
    if (!merchantsSimilar(input.merchant, label)) continue;
    return {
      transactionId: tx.id,
      merchant: label || 'Unknown',
      amount: Number(tx.amount),
      currency: tx.currency || input.currency,
      date: tx.date,
    };
  }

  return null;
}
