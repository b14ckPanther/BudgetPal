/**
 * Authenticated API fetch with safe error parsing and session recovery.
 */

import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { parseApiErrorResponse, isNetworkError, ParsedApiError } from '@/lib/apiErrors';
import { handleUnauthorizedSession } from '@/lib/sessionRecovery';

export class ApiRequestError extends Error {
  parsed: ParsedApiError;

  constructor(parsed: ParsedApiError) {
    super(parsed.userMessage);
    this.name = 'ApiRequestError';
    this.parsed = parsed;
  }
}

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8081`;
  }
  return 'http://localhost:8081';
}

async function getAccessToken(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    throw new ApiRequestError({
      code: 'UNAUTHORIZED',
      messageKey: 'errors.unauthorized',
      userMessage: '',
      status: 401,
      isUnauthorized: true,
      isNetwork: false,
    });
  }
  return sessionData.session.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = `${getApiBaseUrl()}${path}`;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    headers.Authorization = `Bearer ${token}`;
  }

  if (fetchOptions.body && !headers['Content-Type'] && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, { ...fetchOptions, headers });
  } catch (err) {
    if (isNetworkError(err)) {
      throw new ApiRequestError(parseApiErrorResponse(0, null, true));
    }
    throw err;
  }

  let body: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const parsed = parseApiErrorResponse(response.status, body);
    if (parsed.isUnauthorized) {
      void handleUnauthorizedSession();
    }
    throw new ApiRequestError(parsed);
  }

  return body as T;
}
