import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const SENSITIVE_RECEIPT_FIELDS = ['file_url', 'raw_text', 'storage_path'];
const SENSITIVE_REPORT_FIELDS = ['file_url', 'data_snapshot_hash', 'failure_reason', 'idempotency_key'];

function stripFields<T extends Record<string, unknown>>(row: T, fields: string[]): Record<string, unknown> {
  const copy = { ...row };
  for (const field of fields) {
    delete copy[field];
  }
  return copy;
}

export async function buildAccountExportJson(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Record<string, unknown>> {
  const [
    profileRes,
    budgetsRes,
    categoriesRes,
    limitsRes,
    transactionsRes,
    messagesRes,
    actionsRes,
    receiptsRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('budgets').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('budget_category_limits').select('*').eq('user_id', userId),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted'),
    supabase.from('agent_messages').select('*').eq('user_id', userId),
    supabase.from('agent_actions').select('*').eq('user_id', userId),
    supabase.from('receipts').select('*').eq('user_id', userId),
    supabase.from('reports').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error) throw profileRes.error;

  const profile = profileRes.data
    ? stripFields(profileRes.data as Record<string, unknown>, [])
    : null;

  return {
    exportedAt: new Date().toISOString(),
    app: 'BudgetPal',
    version: '1.0.0',
    profile,
    budgets: budgetsRes.data || [],
    categories: categoriesRes.data || [],
    categoryLimits: limitsRes.data || [],
    transactions: transactionsRes.data || [],
    agentMessages: messagesRes.data || [],
    agentActions: actionsRes.data || [],
    receipts: (receiptsRes.data || []).map((r) =>
      stripFields(r as Record<string, unknown>, SENSITIVE_RECEIPT_FIELDS)
    ),
    reports: (reportsRes.data || []).map((r) =>
      stripFields(r as Record<string, unknown>, SENSITIVE_REPORT_FIELDS)
    ),
  };
}
