/**
 * Shared orchestration for text and voice agent messages.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { classifyIntent } from './classifyIntent';
import { handleAgentIntent } from './handleAgentIntent';
import { resolveAgentLanguage } from './language';

export type AgentChannel = 'text' | 'voice';

export interface ProcessAgentMessageResult {
  message: string;
  intent: string;
  confidence: number;
  transcription?: string;
  cards: Array<{ type: string; title: string; data: Record<string, unknown> }>;
  actions: Array<Record<string, unknown>>;
  suggestedPrompts: string[];
}

export async function processAgentMessage(
  supabase: SupabaseClient<Database>,
  userId: string,
  messageText: string,
  options: { channel?: AgentChannel } = {}
): Promise<ProcessAgentMessageResult> {
  const channel = options.channel ?? 'text';
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, display_name, currency, preferred_language')
    .eq('id', userId)
    .single();

  const userName = profile?.first_name || profile?.display_name || 'there';
  const currency = profile?.currency || 'ILS';
  const language = resolveAgentLanguage(profile?.preferred_language);

  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name, type, parent_category_id')
    .eq('user_id', userId);

  const userCategories = (categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentCategoryId: c.parent_category_id || null,
  }));

  const classification = await classifyIntent(messageText, { today, userName, language });
  const { intent, confidence } = classification;

  const userContent =
    channel === 'voice' ? `"${messageText}"` : messageText;

  const { data: userMessage } = await supabase
    .from('agent_messages')
    .insert({
      user_id: userId,
      role: 'user',
      content: userContent,
      intent,
      confidence,
      metadata: channel === 'voice' ? { channel: 'voice', transcription: messageText } : {},
    })
    .select()
    .single();

  const handled = await handleAgentIntent(supabase, userId, intent, messageText, {
    today,
    currency,
    userName,
    userCategories,
    classificationMessage: classification.message,
    userMessageId: userMessage?.id,
    channel,
    transcription: channel === 'voice' ? messageText : undefined,
    language,
  });

  await supabase.from('agent_messages').insert({
    user_id: userId,
    role: 'agent',
    content: handled.agentResponseContent,
    intent,
    confidence,
    metadata: {
      cards: handled.cards,
      actions: handled.actions,
      suggestedPrompts: handled.suggestedPrompts,
      channel,
    } as Database['public']['Tables']['agent_messages']['Insert']['metadata'],
  });

  return {
    message: handled.agentResponseContent,
    intent,
    confidence,
    transcription: channel === 'voice' ? messageText : undefined,
    cards: handled.cards,
    actions: handled.actions,
    suggestedPrompts: handled.suggestedPrompts,
  };
}
