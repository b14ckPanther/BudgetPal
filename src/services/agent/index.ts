import { supabase } from '@/lib/supabase';
import { AgentMessage, AgentAction, ActionStatus, AgentResponse } from '@/types/agent';
import { Database } from '@/types/database';
import { mapAgentMessage, mapAgentAction } from '../mapper';
import { apiFetch } from '@/lib/apiFetch';

/**
 * Fetch all agent messages for the current user, ordered by creation time.
 */
export async function getAgentMessages(): Promise<AgentMessage[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching agent messages:', error);
    return [];
  }

  return data.map(mapAgentMessage);
}

/**
 * Send a message to the agent API endpoint.
 */
export async function sendMessageToAgent(message: string): Promise<AgentResponse> {
  return apiFetch<AgentResponse>('/api/agent/message', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Confirm a proposed agent action.
 */
export async function confirmAgentAction(
  actionId: string,
  overrides?: Record<string, unknown>
): Promise<unknown> {
  return apiFetch('/api/agent/confirm-action', {
    method: 'POST',
    body: JSON.stringify({
      actionId,
      action: 'confirm',
      ...(overrides ? { overrides } : {}),
    }),
  });
}

/**
 * Cancel a proposed agent action.
 */
export async function cancelAgentAction(actionId: string): Promise<unknown> {
  return apiFetch('/api/agent/confirm-action', {
    method: 'POST',
    body: JSON.stringify({
      actionId,
      action: 'cancel',
    }),
  });
}

/**
 * Clear authenticated user's agent chat history and pending proposals.
 */
export async function clearAgentHistory(): Promise<void> {
  await apiFetch('/api/agent/clear-history', { method: 'POST' });
}

/**
 * Create a local message in the database (e.g. for fallback or initial seeding).
 */
export async function createAgentMessage(msg: Partial<AgentMessage>): Promise<AgentMessage> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const metadata = {
    cards: msg.cards || [],
  };

  const dbInsert = {
    user_id: user.id,
    role: msg.role || 'user',
    content: msg.content || '',
    intent: msg.intent || null,
    confidence: msg.confidence !== undefined ? msg.confidence : null,
    metadata: metadata as any,
  };

  const { data, error } = await supabase
    .from('agent_messages')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create agent message');
  }

  return mapAgentMessage(data);
}

/**
 * Create a local agent action in the database (e.g. for fallback/testing).
 */
export async function createAgentAction(action: Partial<AgentAction> & { messageId?: string }): Promise<AgentAction> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    message_id: action.messageId || null,
    action_type: action.type || '',
    payload: (action.payload || {}) as any,
    status: action.status || 'proposed',
    confidence: action.confidence !== undefined ? action.confidence : null,
    requires_confirmation: action.requiresConfirmation !== undefined ? action.requiresConfirmation : true,
  };

  const { data, error } = await supabase
    .from('agent_actions')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create agent action');
  }

  return mapAgentAction(data);
}

/**
 * Update agent action status locally.
 */
export async function updateAgentActionStatus(id: string, status: ActionStatus): Promise<AgentAction> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['agent_actions']['Update'] = {
    status,
  };

  if (status === 'executed') {
    dbUpdate.executed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('agent_actions')
    .update(dbUpdate)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update agent action status');
  }

  return mapAgentAction(data);
}
