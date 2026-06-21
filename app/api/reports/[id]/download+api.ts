import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../../src/server/auth';
import { createReportDownloadUrl } from '../../../../src/server/reports/storageReportPdf';
import { handleApiRouteError, apiErrorResponse } from '../../../../src/server/apiErrors';

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
      .select('id, file_url, status')
      .eq('id', reportId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !row || row.status !== 'ready' || !row.file_url) {
      return apiErrorResponse('NOT_FOUND', 404);
    }

    const downloadUrl = await createReportDownloadUrl(row.file_url, 60);
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    return Response.json({ downloadUrl, expiresAt });
  } catch (error: unknown) {
    return handleApiRouteError('reports-download', error);
  }
}
