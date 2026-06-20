import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { AgentMessageRequestSchema } from '../../../src/server/validation';
import { processAgentMessage } from '../../../src/server/agent/processAgentMessage';

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

    const handled = await processAgentMessage(supabase, userId, result.data.message, {
      channel: 'text',
    });

    return Response.json(handled);
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
