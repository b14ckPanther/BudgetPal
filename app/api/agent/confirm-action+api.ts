import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { ConfirmActionSchema } from '../../../src/server/validation';
import { confirmAction, cancelAction } from '../../../src/server/agent/executeAction';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const result = ConfirmActionSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.message }, { status: 400 });
    }

    const { actionId, action } = result.data;

    if (action === 'confirm') {
      const confirmResult = await confirmAction(supabase, userId, actionId);
      return Response.json({
        success: true,
        action: 'confirmed',
        result: confirmResult,
      });
    }

    await cancelAction(supabase, userId, actionId);
    return Response.json({
      success: true,
      action: 'cancelled',
    });
  } catch (error: unknown) {
    console.error('Error in agent confirm-action route:', error);
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return Response.json(
      { error: err.message || 'Internal Server Error' },
      { status }
    );
  }
}
