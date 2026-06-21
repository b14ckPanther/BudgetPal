/**
 * Single-flight session expiry recovery — one logout flow for concurrent 401s.
 */

import { QueryClient } from '@tanstack/react-query';
import { Router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

type ToastFn = (options: { variant: 'error' | 'info' | 'success' | 'warning'; message: string }) => void;

let recoveryInFlight = false;
let recoveryCompleted = false;
let toastFn: ToastFn | null = null;
let routerRef: Router | null = null;
let queryClientRef: QueryClient | null = null;

export function configureSessionRecovery(options: {
  router: Router;
  queryClient: QueryClient;
  toast: ToastFn;
}): void {
  routerRef = options.router;
  queryClientRef = options.queryClient;
  toastFn = options.toast;
}

export function resetSessionRecoveryGuard(): void {
  recoveryInFlight = false;
  recoveryCompleted = false;
}

export async function handleUnauthorizedSession(): Promise<void> {
  if (recoveryCompleted || recoveryInFlight) return;
  recoveryInFlight = true;

  try {
    await supabase.auth.signOut();
    queryClientRef?.clear();

    if (toastFn && !recoveryCompleted) {
      toastFn({
        variant: 'error',
        message: t('feedback.sessionExpired'),
      });
    }

    recoveryCompleted = true;
    routerRef?.replace('/(auth)/login');
  } catch {
    routerRef?.replace('/(auth)/login');
  } finally {
    recoveryInFlight = false;
  }
}
