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

type ActionPayload = Record<string, unknown>;

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
  actionId: string,
  payload?: ActionPayload
) {
  const update: Database['public']['Tables']['agent_actions']['Update'] = {
    status: 'executed',
    executed_at: new Date().toISOString(),
  };
  if (payload) {
    update.payload = payload as Database['public']['Tables']['agent_actions']['Update']['payload'];
  }

  const { error } = await supabase.from('agent_actions').update(update).eq('id', actionId);
  if (error) console.error('Error updating agent action status:', error);
}

async function findExecutedTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: ActionPayload
) {
  const executedTransactionId = payload.executedTransactionId as string | undefined;
  if (executedTransactionId) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', executedTransactionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (tx) return tx;
  }

  const voiceEntryId = payload.voiceEntryId as string | undefined;
  if (voiceEntryId) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('voice_entry_id', voiceEntryId)
      .eq('user_id', userId)
      .maybeSingle();
    if (tx) return tx;
  }

  return null;
}

async function updateVoiceEntryStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  voiceEntryId: string | undefined,
  status: 'confirmed' | 'rejected'
) {
  if (!voiceEntryId) return;
  await supabase
    .from('voice_entries')
    .update({ status })
    .eq('id', voiceEntryId)
    .eq('user_id', userId);
}

async function confirmTransactionAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string,
  payload: unknown,
  overrides?: Record<string, unknown>
) {
  const actionPayload = (payload || {}) as ActionPayload;

  const existingTx = await findExecutedTransaction(supabase, userId, actionPayload);
  if (existingTx) {
    return { type: 'transaction' as const, transaction: existingTx, alreadyExecuted: true };
  }

  const merged = { ...actionPayload, ...(overrides || {}) };
  const parsed = TransactionProposalSchema.parse(merged);
  const categories = await loadUserCategories(supabase, userId);
  const resolvedCategories = resolveProposalCategories(categories, parsed);

  const source =
    actionPayload.source === 'voice' ? 'voice' : 'text';
  const voiceEntryId = (actionPayload.voiceEntryId as string | undefined) ?? undefined;

  const { data: locked, error: lockError } = await supabase
    .from('agent_actions')
    .update({ status: 'confirmed' })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'proposed')
    .select()
    .single();

  if (lockError || !locked) {
    const { data: current } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single();

    if (current?.status === 'executed') {
      const tx = await findExecutedTransaction(supabase, userId, current.payload as ActionPayload);
      if (tx) {
        return { type: 'transaction' as const, transaction: tx, alreadyExecuted: true };
      }
      return { type: 'transaction' as const, alreadyExecuted: true };
    }

    if (current?.status === 'cancelled') {
      throw new Error('This proposal was cancelled and can no longer be confirmed.');
    }

    throw new Error('This action can no longer be confirmed.');
  }

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
    source,
    confidence: parsed.confidence,
    status: 'confirmed',
    note: parsed.note || null,
    voice_entry_id: voiceEntryId || null,
  };

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert(transactionInsert)
    .select()
    .single();

  if (txError || !transaction) {
    await supabase
      .from('agent_actions')
      .update({ status: 'proposed' })
      .eq('id', actionId)
      .eq('user_id', userId);
    throw new Error('Failed to create transaction');
  }

  const updatedPayload: ActionPayload = {
    ...actionPayload,
    ...(overrides || {}),
    executedTransactionId: transaction.id,
  };

  await markExecuted(supabase, actionId, updatedPayload);
  await updateVoiceEntryStatus(supabase, userId, voiceEntryId, 'confirmed');

  if (voiceEntryId) {
    await supabase
      .from('voice_entries')
      .update({
        interpreted_payload: parsed as Database['public']['Tables']['voice_entries']['Update']['interpreted_payload'],
        confidence: parsed.confidence,
      })
      .eq('id', voiceEntryId)
      .eq('user_id', userId);
  }

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

  const { data: locked, error: lockError } = await supabase
    .from('agent_actions')
    .update({ status: 'confirmed' })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'proposed')
    .select()
    .single();

  if (lockError || !locked) {
    const { data: current } = await supabase
      .from('agent_actions')
      .select('status')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single();

    if (current?.status === 'executed') {
      return { type: 'budget_limit' as const, proposal, alreadyExecuted: true };
    }
    throw new Error('This action can no longer be confirmed.');
  }

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
  actionId: string,
  overrides?: Record<string, unknown>
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

  if (action.status === 'executed') {
    if (action.action_type === 'CREATE_TRANSACTION') {
      const tx = await findExecutedTransaction(supabase, userId, action.payload as ActionPayload);
      if (tx) {
        return { type: 'transaction' as const, transaction: tx, alreadyExecuted: true };
      }
    }
    return { alreadyExecuted: true };
  }

  if (action.status === 'cancelled') {
    throw new Error('This proposal was cancelled and can no longer be confirmed.');
  }

  if (action.status !== 'proposed' && action.status !== 'confirmed') {
    throw new Error(`Action cannot be confirmed because it is in status: ${action.status}`);
  }

  switch (action.action_type) {
    case 'CREATE_TRANSACTION':
      return confirmTransactionAction(supabase, userId, actionId, action.payload, overrides);
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

  if (action.status === 'cancelled') {
    return { success: true, alreadyCancelled: true };
  }

  if (action.status === 'executed') {
    throw new Error('This action was already confirmed and cannot be cancelled.');
  }

  if (action.status !== 'proposed') {
    throw new Error(`Action cannot be cancelled because it is in status: ${action.status}`);
  }

  const payload = action.payload as ActionPayload;
  const voiceEntryId = payload.voiceEntryId as string | undefined;

  const { error: updateError } = await supabase
    .from('agent_actions')
    .update({ status: 'cancelled' })
    .eq('id', actionId)
    .eq('status', 'proposed');

  if (updateError) {
    throw new Error('Failed to cancel action');
  }

  await updateVoiceEntryStatus(supabase, userId, voiceEntryId, 'rejected');

  return { success: true };
}
