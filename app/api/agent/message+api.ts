import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { AgentMessageRequestSchema } from '../../../src/server/validation';
import { processAgentMessage } from '../../../src/server/agent/processAgentMessage';
import { apiErrorResponse, handleApiRouteError } from '../../../src/server/apiErrors';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const result = AgentMessageRequestSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const handled = await processAgentMessage(supabase, userId, result.data.message, {
      channel: 'text',
    });

    return Response.json(handled);
  } catch (error: unknown) {
    return handleApiRouteError('agent-message', error);
  }
}
