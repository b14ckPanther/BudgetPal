import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { ReportGenerateRequestSchema } from '../../../src/server/validation';
import { processReportGenerate } from '../../../src/server/reports/processReportGenerate';
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

    const parsed = ReportGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const result = await processReportGenerate(supabase, userId, parsed.data);

    if (!result.ok) {
      if ('noData' in result && result.noData) {
        return Response.json({ noData: true, message: result.message }, { status: 200 });
      }
      if ('statusCode' in result && result.statusCode === 409) {
        return apiErrorResponse('CONFLICT', 409);
      }
      return Response.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            messageKey: 'errors.generic',
          },
        },
        { status: 422 }
      );
    }

    return Response.json({ report: result.report, reused: result.reused });
  } catch (error: unknown) {
    return handleApiRouteError('reports-generate', error);
  }
}
