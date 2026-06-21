import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { buildTransactionsCsv } from '../../../src/server/export/buildTransactionsCsv';
import { handleApiRouteError } from '../../../src/server/apiErrors';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);
    const csv = await buildTransactionsCsv(supabase, userId);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="budgetpal-transactions-${date}.csv"`,
      },
    });
  } catch (error: unknown) {
    return handleApiRouteError('export-transactions', error);
  }
}
