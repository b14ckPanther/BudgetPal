import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { AgentMessageRequestSchema } from '../../../src/server/validation';
import { classifyIntent } from '../../../src/server/agent/classifyIntent';
import { handleAgentIntent } from '../../../src/server/agent/handleAgentIntent';
import { Database } from '../../../src/types/database';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const result = AgentMessageRequestSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.message }, { status: 400 });
    }

    const { message } = result.data;
    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, display_name, currency')
      .eq('id', userId)
      .single();

    const userName = profile?.first_name || profile?.display_name || 'there';
    const currency = profile?.currency || 'ILS';

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

    const classification = await classifyIntent(message, { today, userName });
    const { intent, confidence } = classification;

    const { data: userMessage } = await supabase
      .from('agent_messages')
      .insert({
        user_id: userId,
        role: 'user',
        content: message,
        intent,
        confidence,
        metadata: {},
      })
      .select()
      .single();

    const handled = await handleAgentIntent(supabase, userId, intent, message, {
      today,
      currency,
      userName,
      userCategories,
      classificationMessage: classification.message,
      userMessageId: userMessage?.id,
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
      } as Database['public']['Tables']['agent_messages']['Insert']['metadata'],
    });

    return Response.json({
      message: handled.agentResponseContent,
      intent,
      confidence,
      cards: handled.cards,
      actions: handled.actions,
      suggestedPrompts: handled.suggestedPrompts,
    });
  } catch (error: unknown) {
    console.error('Error in agent message route:', error);
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return Response.json(
      { error: err.message || 'Internal Server Error' },
      { status }
    );
  }
}
