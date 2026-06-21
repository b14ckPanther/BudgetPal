import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function buildTransactionsCsv(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(
      'date, type, amount, currency, merchant, title, category_id, subcategory_id, source, status, note'
    )
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('date', { ascending: false });

  if (error) throw error;

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_category_id')
    .eq('user_id', userId);

  const catMap = new Map((categories || []).map((c) => [c.id, c]));

  const headers = [
    'date',
    'type',
    'amount',
    'currency',
    'merchant',
    'title',
    'parent_category',
    'subcategory',
    'source',
    'status',
    'note',
  ];

  const rows = (transactions || []).map((tx) => {
    const cat = tx.category_id ? catMap.get(tx.category_id) : undefined;
    const sub = tx.subcategory_id ? catMap.get(tx.subcategory_id) : undefined;
    const parentName =
      sub?.parent_category_id && catMap.get(sub.parent_category_id)?.name
        ? catMap.get(sub.parent_category_id)!.name
        : cat?.name || '';
    const subName = sub?.name || (cat?.parent_category_id ? cat.name : '');

    return [
      tx.date,
      tx.type,
      tx.amount,
      tx.currency,
      tx.merchant,
      tx.title,
      parentName,
      subName,
      tx.source,
      tx.status,
      tx.note,
    ]
      .map(escapeCsv)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
