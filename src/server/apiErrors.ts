/**
 * Safe API error responses — never expose raw backend details to clients.
 */

import { AuthError } from './auth';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'CLEAR_HISTORY_PENDING';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  messageKey: string;
}

export interface ApiErrorResponseBody {
  error: ApiErrorPayload;
}

const CODE_TO_KEY: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'errors.unauthorized',
  INVALID_INPUT: 'errors.invalidInput',
  NOT_FOUND: 'errors.notFound',
  CONFLICT: 'errors.conflict',
  SERVICE_UNAVAILABLE: 'errors.serviceUnavailable',
  INTERNAL_ERROR: 'errors.generic',
  CLEAR_HISTORY_PENDING: 'errors.clearHistoryPending',
};

export function apiErrorResponse(
  code: ApiErrorCode,
  status: number,
  messageKey?: string
): Response {
  const body: ApiErrorResponseBody = {
    error: {
      code,
      messageKey: messageKey || CODE_TO_KEY[code],
    },
  };
  return Response.json(body, { status });
}

export function logApiError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    const err = error as { message?: string; name?: string };
    console.error(`[API] ${context}`, err.name || 'Error', err.message || '');
  } else {
    console.error(`[API] ${context}`);
  }
}

export function handleApiRouteError(context: string, error: unknown): Response {
  logApiError(context, error);

  if (error instanceof AuthError) {
    return apiErrorResponse('UNAUTHORIZED', error.statusCode || 401);
  }

  const err = error as { statusCode?: number; code?: ApiErrorCode; messageKey?: string };
  if (err.code && err.messageKey) {
    return apiErrorResponse(err.code, err.statusCode || 400, err.messageKey);
  }

  return apiErrorResponse('INTERNAL_ERROR', 500);
}

export class ApiRouteError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  messageKey: string;

  constructor(code: ApiErrorCode, statusCode: number, messageKey?: string) {
    super(code);
    this.name = 'ApiRouteError';
    this.code = code;
    this.statusCode = statusCode;
    this.messageKey = messageKey || CODE_TO_KEY[code];
  }
}
