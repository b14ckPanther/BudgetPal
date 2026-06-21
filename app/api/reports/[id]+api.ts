import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { handleApiRouteError, apiErrorResponse } from '../../../src/server/apiErrors';

export async function GET(
  request: ExpoRequest,
  { id }: { id: string }
): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);
    const reportId = id;

    if (!reportId) {
      return apiErrorResponse('NOT_FOUND', 404);
    }

    const { data: row, error } = await supabase
      .from('reports')
      .select(
        'id, title, type, date_from, date_to, summary, metrics, status, created_at, updated_at'
      )
      .eq('id', reportId)
      .eq('user_id', userId)
      .eq('status', 'ready')
      .maybeSingle();

    if (error || !row) {
      return apiErrorResponse('NOT_FOUND', 404);
    }

    return Response.json({
      report: {
        id: row.id,
        title: row.title,
        type: row.type,
        dateFrom: row.date_from || '',
        dateTo: row.date_to || '',
        summary: row.summary || '',
        metrics: row.metrics,
        status: row.status,
        hasPdf: row.status === 'ready',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: unknown) {
    return handleApiRouteError('reports-get', error);
  }
}
