import { ExpoRequest } from 'expo-router/server';

export async function GET(request: ExpoRequest): Promise<Response> {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
