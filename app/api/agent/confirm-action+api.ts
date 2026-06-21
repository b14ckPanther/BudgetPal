import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { ConfirmActionSchema } from '../../../src/server/validation';
import { confirmAction, cancelAction } from '../../../src/server/agent/executeAction';
import { apiErrorResponse, handleApiRouteError, ApiRouteError } from '../../../src/server/apiErrors';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const result = ConfirmActionSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const { actionId, action, overrides } = result.data;

    try {
      if (action === 'confirm') {
        const confirmResult = await confirmAction(supabase, userId, actionId, overrides);
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
    } catch (actionErr: unknown) {
      const msg = actionErr instanceof Error ? actionErr.message : '';
      if (msg.includes('cancelled') || msg.includes('already')) {
        throw new ApiRouteError('CONFLICT', 409);
      }
      if (msg.includes('valid') || msg.includes('receipt total')) {
        throw new ApiRouteError('INVALID_INPUT', 400);
      }
      throw new ApiRouteError('INTERNAL_ERROR', 500);
    }
  } catch (error: unknown) {
    return handleApiRouteError('confirm-action', error);
  }
}
