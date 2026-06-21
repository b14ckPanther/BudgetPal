import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { buildAccountExportJson } from '../../../src/server/export/buildAccountExport';
import { handleApiRouteError } from '../../../src/server/apiErrors';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);
    const payload = await buildAccountExportJson(supabase, userId);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="budgetpal-account-export-${date}.json"`,
      },
    });
  } catch (error: unknown) {
    return handleApiRouteError('export-account', error);
  }
}
