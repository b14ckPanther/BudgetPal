/**
 * Receipt scan orchestration: storage, extraction, agent records.
 */

import { randomUUID } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { HierarchyCategory, resolveCategoryAssignment, sanitizeMerchant } from '../../lib/categoryHierarchy';
import { extractReceiptFromImage } from './extractReceipt';
import { uploadReceiptImage, deleteReceiptImage } from './storageReceiptImage';
import { detectDuplicateReceipt } from './detectDuplicate';
import { normalizeImageMime } from './validateImageUpload';
import { ProcessAgentMessageResult } from '../agent/processAgentMessage';

function buildMerchantTitle(merchant: string | null): string {
  const cleaned = sanitizeMerchant(merchant || '');
  return cleaned || 'Receipt purchase';
}

export async function processReceiptScan(
  supabase: SupabaseClient<Database>,
  userId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<ProcessAgentMessageResult> {
  const today = new Date().toISOString().split('T')[0];
  const receiptId = randomUUID();
  const normalizedMime = normalizeImageMime(mimeType);

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single();

  const currency = profile?.currency || 'ILS';

  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name, type, parent_category_id')
    .eq('user_id', userId);

  const userCategories: HierarchyCategory[] = (categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentCategoryId: c.parent_category_id || null,
  }));

  let storagePath: string | null = null;

  try {
    storagePath = await uploadReceiptImage(userId, receiptId, imageBuffer, normalizedMime);

    const extraction = await extractReceiptFromImage(imageBuffer, normalizedMime, {
      today,
      currency,
      categories: userCategories,
    });

    const resolved = resolveCategoryAssignment(
      userCategories,
      extraction.suggestedCategoryName,
      extraction.suggestedSubcategoryName ?? undefined,
      'expense'
    );

    const requiresManualAmount =
      extraction.totalAmount == null || extraction.totalAmount <= 0 || extraction.confidence < 0.45;

    const merchant = extraction.merchant ? sanitizeMerchant(extraction.merchant) : null;
    const title = buildMerchantTitle(merchant);
    const receiptDate = extraction.receiptDate || today;

    const duplicate = await detectDuplicateReceipt(supabase, userId, {
      merchant,
      amount: extraction.totalAmount,
      currency: extraction.currency || currency,
      receiptDate: extraction.receiptDate,
      today,
    });

    const { data: receiptRow, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        id: receiptId,
        user_id: userId,
        file_url: storagePath,
        merchant,
        receipt_date: extraction.receiptDate,
        total_amount: extraction.totalAmount,
        currency: extraction.currency || currency,
        extracted_items: extraction.lineItems as Database['public']['Tables']['receipts']['Insert']['extracted_items'],
        confidence: extraction.confidence,
        status: 'pending_review',
      })
      .select()
      .single();

    if (receiptError || !receiptRow) {
      await deleteReceiptImage(userId, receiptId);
      throw new Error('Could not save receipt scan. Please try again.');
    }

    const { data: userMessage } = await supabase
      .from('agent_messages')
      .insert({
        user_id: userId,
        role: 'user',
        content: '[Receipt scan]',
        intent: 'scan_receipt',
        confidence: extraction.confidence,
        metadata: { channel: 'receipt' },
      })
      .select()
      .single();

    const actionPayload: Record<string, unknown> = {
      type: 'expense',
      amount: requiresManualAmount ? null : extraction.totalAmount,
      currency: extraction.currency || currency,
      merchant,
      title,
      categoryId: resolved.categoryId || null,
      categoryName: resolved.categoryName,
      subcategoryId: resolved.subcategoryId || null,
      subcategoryName: resolved.subcategoryName || null,
      date: receiptDate,
      confidence: extraction.confidence,
      source: 'receipt',
      receiptId,
      requiresManualAmount,
      uncertaintyNotes: extraction.uncertaintyNotes,
    };

    const { data: action, error: actionError } = await supabase
      .from('agent_actions')
      .insert({
        user_id: userId,
        message_id: userMessage?.id || null,
        action_type: 'CREATE_TRANSACTION',
        payload: actionPayload as Database['public']['Tables']['agent_actions']['Insert']['payload'],
        status: 'proposed',
        confidence: extraction.confidence,
        requires_confirmation: true,
      })
      .select()
      .single();

    if (actionError || !action) {
      await supabase.from('receipts').update({ status: 'rejected' }).eq('id', receiptId).eq('user_id', userId);
      await deleteReceiptImage(userId, receiptId);
      throw new Error('Could not prepare receipt for review. Please try again.');
    }

    const duplicateWarning = duplicate
      ? {
          transactionId: duplicate.transactionId,
          merchant: duplicate.merchant,
          amount: duplicate.amount,
          currency: duplicate.currency,
          date: duplicate.date,
        }
      : undefined;

    const cardData: Record<string, unknown> = {
      actionId: action.id,
      receiptId,
      merchant: merchant || 'Unknown merchant',
      date: receiptDate,
      totalAmount: requiresManualAmount ? null : extraction.totalAmount,
      currency: extraction.currency || currency,
      categoryName: resolved.categoryName,
      subcategoryName: resolved.subcategoryName || null,
      confidence: extraction.confidence,
      items: extraction.lineItems.filter((item) => item.name?.trim()),
      requiresManualAmount,
      uncertaintyNotes: extraction.uncertaintyNotes,
      duplicateWarning,
    };

    const agentResponseContent = requiresManualAmount
      ? 'I scanned your receipt but could not read a reliable total. Please review the details and enter the amount before confirming.'
      : duplicate
        ? 'I found a possible duplicate receipt. Please review the details before confirming.'
        : 'I scanned your receipt. Please review and confirm the details below.';

    const cards = [
      {
        type: 'receipt_preview',
        title: 'Receipt Preview',
        data: cardData,
      },
    ];

    const actions = [
      {
        id: action.id,
        type: 'CREATE_TRANSACTION',
        payload: actionPayload,
        status: 'proposed',
        confidence: extraction.confidence,
        requiresConfirmation: true,
      },
    ];

    await supabase.from('agent_messages').insert({
      user_id: userId,
      role: 'agent',
      content: agentResponseContent,
      intent: 'scan_receipt',
      confidence: extraction.confidence,
      metadata: {
        cards,
        actions,
        channel: 'receipt',
      } as Database['public']['Tables']['agent_messages']['Insert']['metadata'],
    });

    return {
      message: agentResponseContent,
      intent: 'scan_receipt',
      confidence: extraction.confidence,
      cards,
      actions,
      suggestedPrompts: [],
    };
  } catch (err) {
    if (storagePath) {
      await deleteReceiptImage(userId, receiptId);
    }
    if (err instanceof Error) throw err;
    throw new Error('Could not scan this receipt. Please try again.');
  }
}
