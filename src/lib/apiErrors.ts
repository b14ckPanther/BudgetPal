/**
 * Client-side API error parsing and localized user messages.
 */

import { t } from '@/lib/i18n';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'CLEAR_HISTORY_PENDING';

export interface ParsedApiError {
  code: ApiErrorCode;
  messageKey: string;
  userMessage: string;
  status: number;
  isUnauthorized: boolean;
  isNetwork: boolean;
}

const KEY_FALLBACKS: Record<string, string> = {
  'errors.unauthorized': 'feedback.sessionExpired',
  'errors.invalidInput': 'errors.invalidInput',
  'errors.notFound': 'errors.notFound',
  'errors.conflict': 'errors.conflict',
  'errors.serviceUnavailable': 'errors.serviceUnavailable',
  'errors.generic': 'feedback.genericError',
  'errors.clearHistoryPending': 'errors.clearHistoryPending',
  'errors.network': 'feedback.connectionFailed',
  'errors.timeout': 'errors.timeout',
};

function translateKey(messageKey: string): string {
  const translated = t(messageKey);
  if (translated !== messageKey) return translated;
  const fallbackKey = KEY_FALLBACKS[messageKey];
  if (fallbackKey) {
    const fallback = t(fallbackKey);
    if (fallback !== fallbackKey) return fallback;
  }
  return t('feedback.genericError');
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('timeout')
  );
}

export function parseApiErrorResponse(
  status: number,
  body: unknown,
  networkFailure = false
): ParsedApiError {
  if (networkFailure || status === 0) {
    return {
      code: 'SERVICE_UNAVAILABLE',
      messageKey: 'errors.network',
      userMessage: translateKey('errors.network'),
      status: 0,
      isUnauthorized: false,
      isNetwork: true,
    };
  }

  if (status === 401) {
    return {
      code: 'UNAUTHORIZED',
      messageKey: 'errors.unauthorized',
      userMessage: translateKey('errors.unauthorized'),
      status: 401,
      isUnauthorized: true,
      isNetwork: false,
    };
  }

  const payload = body as { error?: { code?: ApiErrorCode; messageKey?: string } };
  if (payload?.error?.code && payload?.error?.messageKey) {
    return {
      code: payload.error.code,
      messageKey: payload.error.messageKey,
      userMessage: translateKey(payload.error.messageKey),
      status,
      isUnauthorized: payload.error.code === 'UNAUTHORIZED',
      isNetwork: false,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    messageKey: 'errors.generic',
    userMessage: translateKey('errors.generic'),
    status,
    isUnauthorized: false,
    isNetwork: false,
  };
}

export function getUserFacingMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'parsed' in err) {
    const parsed = (err as { parsed: ParsedApiError }).parsed;
    if (parsed?.userMessage) return parsed.userMessage;
  }
  return parseThrownError(err).userMessage;
}

export function parseThrownError(err: unknown): ParsedApiError {
  if (isNetworkError(err)) {
    return {
      code: 'SERVICE_UNAVAILABLE',
      messageKey: 'errors.network',
      userMessage: translateKey('errors.network'),
      status: 0,
      isUnauthorized: false,
      isNetwork: true,
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    messageKey: 'errors.generic',
    userMessage: translateKey('errors.generic'),
    status: 500,
    isUnauthorized: false,
    isNetwork: false,
  };
}
