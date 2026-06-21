import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { handleApiRouteError, apiErrorResponse } from '../../../src/server/apiErrors';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    const { data, error } = await supabase
      .from('reports')
      .select(
        'id, title, type, date_from, date_to, summary, metrics, status, created_at'
      )
      .eq('user_id', userId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const reports = (data || []).map((row) => ({
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
    }));

    return Response.json({ reports });
  } catch (error: unknown) {
    return handleApiRouteError('reports-list', error);
  }
}
