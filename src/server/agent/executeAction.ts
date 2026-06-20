/**
 * BudgetPal — Execute Agent Actions
 * Confirms or cancels proposed agent actions in the database.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { TransactionProposalSchema, BudgetLimitProposalSchema } from '../validation';
import {
  HierarchyCategory,
  resolveCategoryAssignment,
  sanitizeMerchant,
} from '../../lib/categoryHierarchy';
import { updateOrCreateCategoryLimitServer } from './budgetLimitsServer';
import { loadUserContext } from './loadUserContext';

async function loadUserCategories(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<HierarchyCategory[]> {
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name, type, parent_category_id')
    .eq('user_id', userId);

  return (categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentCategoryId: c.parent_category_id || null,
  }));
}

function resolveProposalCategories(
  categories: HierarchyCategory[],
  payload: {
    categoryId?: string | null;
    categoryName: string;
    subcategoryId?: string | null;
    subcategoryName?: string | null;
    type: string;
  }
) {
  return resolveCategoryAssignment(
    categories,
    payload.categoryName,
    payload.subcategoryName ?? undefined,
    payload.type,
    payload.categoryId ?? undefined,
    payload.subcategoryId ?? undefined
  );
}

async function markExecuted(
  supabase: SupabaseClient<Database>,
  actionId: string
) {
  const { error } = await supabase
    .from('agent_actions')
    .update({ status: 'executed', executed_at: new Date().toISOString() })
    .eq('id', actionId);
  if (error) console.error('Error updating agent action status:', error);
}

async function confirmTransactionAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string,
  payload: unknown
) {
  const parsed = TransactionProposalSchema.parse(payload);
  const categories = await loadUserCategories(supabase, userId);
  const resolvedCategories = resolveProposalCategories(categories, parsed);

  const transactionInsert: Database['public']['Tables']['transactions']['Insert'] = {
    user_id: userId,
    amount: parsed.amount,
    currency: parsed.currency || 'ILS',
    type: parsed.type,
    merchant: sanitizeMerchant(parsed.merchant),
    title: parsed.title,
    category_id: resolvedCategories.categoryId || null,
    subcategory_id: resolvedCategories.subcategoryId || null,
    date: parsed.date || new Date().toISOString().split('T')[0],
    source: 'text',
    confidence: parsed.confidence,
    status: 'confirmed',
    note: parsed.note || null,
  };

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert(transactionInsert)
    .select()
    .single();

  if (txError || !transaction) {
    throw new Error(txError?.message || 'Failed to create transaction');
  }

  await markExecuted(supabase, actionId);
  return { type: 'transaction' as const, transaction };
}

async function confirmBudgetLimitAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string,
  payload: unknown
) {
  const proposal = BudgetLimitProposalSchema.parse(payload);
  const ctx = await loadUserContext(supabase, userId);
  if (!ctx.budget) throw new Error('No active budget');

  const ownedIds = new Set(ctx.categories.map((c) => c.id));

  if (proposal.operation === 'move') {
    if (
      !proposal.sourceCategoryId ||
      !proposal.targetCategoryId ||
      proposal.sourceProposedLimit === undefined ||
      proposal.targetProposedLimit === undefined
    ) {
      throw new Error('Invalid move proposal');
    }
    if (!ownedIds.has(proposal.sourceCategoryId) || !ownedIds.has(proposal.targetCategoryId)) {
      throw new Error('Category not found');
    }
    const sourceCurrent = ctx.limits.find((l) => l.categoryId === proposal.sourceCategoryId)?.monthlyLimit ?? 0;
    if (sourceCurrent - proposal.amount < 0) {
      throw new Error('Source category limit cannot go negative');
    }
    await updateOrCreateCategoryLimitServer(
      supabase,
      userId,
      ctx.budget.id,
      proposal.sourceCategoryId,
      proposal.sourceProposedLimit
    );
    await updateOrCreateCategoryLimitServer(
      supabase,
      userId,
      ctx.budget.id,
      proposal.targetCategoryId,
      proposal.targetProposedLimit
    );
  } else {
    if (!proposal.categoryId || !ownedIds.has(proposal.categoryId)) {
      throw new Error('Category not found');
    }
    if (proposal.proposedLimit < 0) {
      throw new Error('Limit cannot be negative');
    }
    await updateOrCreateCategoryLimitServer(
      supabase,
      userId,
      ctx.budget.id,
      proposal.categoryId,
      proposal.proposedLimit
    );
  }

  await markExecuted(supabase, actionId);
  return { type: 'budget_limit' as const, proposal };
}

/**
 * Confirm a proposed action by type.
 */
export async function confirmAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string
) {
  const { data: action, error: actionError } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', userId)
    .single();

  if (actionError || !action) {
    throw new Error('Action not found or unauthorized');
  }

  if (action.status !== 'proposed') {
    throw new Error(`Action cannot be confirmed because it is in status: ${action.status}`);
  }

  switch (action.action_type) {
    case 'CREATE_TRANSACTION':
      return confirmTransactionAction(supabase, userId, actionId, action.payload);
    case 'UPDATE_BUDGET_LIMIT':
    case 'MOVE_BUDGET_LIMIT':
      return confirmBudgetLimitAction(supabase, userId, actionId, action.payload);
    default:
      throw new Error(`Unsupported action type: ${action.action_type}`);
  }
}

/**
 * Cancel a proposed action.
 */
export async function cancelAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string
) {
  const { data: action, error: actionError } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', userId)
    .single();

  if (actionError || !action) {
    throw new Error('Action not found or unauthorized');
  }

  if (action.status !== 'proposed') {
    throw new Error(`Action cannot be cancelled because it is in status: ${action.status}`);
  }

  const { error: updateError } = await supabase
    .from('agent_actions')
    .update({ status: 'cancelled' })
    .eq('id', actionId);

  if (updateError) {
    throw new Error('Failed to cancel action');
  }

  return { success: true };
}
