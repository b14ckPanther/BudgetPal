import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import {
  apiErrorResponse,
  handleApiRouteError,
  ApiRouteError,
} from '../../../src/server/apiErrors';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    const { data: pendingActions, error: pendingError } = await supabase
      .from('agent_actions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'proposed')
      .limit(1);

    if (pendingError) {
      throw new ApiRouteError('INTERNAL_ERROR', 500);
    }

    if (pendingActions && pendingActions.length > 0) {
      return apiErrorResponse('CLEAR_HISTORY_PENDING', 409);
    }

    const { error: actionsError } = await supabase
      .from('agent_actions')
      .delete()
      .eq('user_id', userId);

    if (actionsError) {
      throw new ApiRouteError('INTERNAL_ERROR', 500);
    }

    const { error: messagesError } = await supabase
      .from('agent_messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError) {
      throw new ApiRouteError('INTERNAL_ERROR', 500);
    }

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return handleApiRouteError('clear-history', error);
  }
}
