import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    const { error: actionsError } = await supabase
      .from('agent_actions')
      .delete()
      .eq('user_id', userId);

    if (actionsError) {
      console.error('Failed to clear agent actions:', actionsError);
      return Response.json({ error: 'Could not clear agent history. Please try again.' }, { status: 500 });
    }

    const { error: messagesError } = await supabase
      .from('agent_messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError) {
      console.error('Failed to clear agent messages:', messagesError);
      return Response.json({ error: 'Could not clear agent history. Please try again.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error in clear-history route:', error);
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return Response.json(
      { error: status === 401 ? 'Unauthorized' : 'Could not clear agent history. Please try again.' },
      { status }
    );
  }
}
