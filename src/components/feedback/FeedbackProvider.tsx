/**
 * BudgetPal — Global themed confirmations and toasts.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { t } from '@/lib/i18n';
import { ConfirmDialog, ConfirmVariant } from './ConfirmDialog';
import { AppToast, ToastVariant } from './AppToast';

export interface ConfirmOptions {
  title: string;
  message: string;
  impact?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Runs with loading state; dialog closes on success. Errors surface as toasts. */
  onConfirm?: () => void | Promise<void>;
}

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface FeedbackContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (options: ToastOptions) => void;
  dismissToast: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

type ConfirmState = {
  visible: boolean;
  title: string;
  message: string;
  impact?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant: ConfirmVariant;
  loading: boolean;
};

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
};

const initialConfirm: ConfirmState = {
  visible: false,
  title: '',
  message: '',
  variant: 'default',
  loading: false,
};

const initialToast: ToastState = {
  visible: false,
  message: '',
  variant: 'info',
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState>(initialConfirm);
  const [toastState, setToastState] = useState<ToastState>(initialToast);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmHandlerRef = useRef<(() => void | Promise<void>) | undefined>(undefined);

  const closeConfirm = useCallback((result: boolean) => {
    confirmResolverRef.current?.(result);
    confirmResolverRef.current = null;
    confirmHandlerRef.current = undefined;
    setConfirmState(initialConfirm);
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    setToastState({
      visible: true,
      message: options.message,
      variant: options.variant ?? 'info',
      durationMs: options.durationMs,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        confirmResolverRef.current = resolve;
        confirmHandlerRef.current = options.onConfirm;
        setConfirmState({
          visible: true,
          title: options.title,
          message: options.message,
          impact: options.impact,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          variant: options.variant ?? 'default',
          loading: false,
        });
      });
    },
    []
  );

  const handleConfirmPress = useCallback(async () => {
    const handler = confirmHandlerRef.current;
    if (!handler) {
      closeConfirm(true);
      return;
    }

    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await handler();
      closeConfirm(true);
    } catch (err: unknown) {
      if (__DEV__) console.error('Confirm action failed:', err);
      setConfirmState((prev) => ({ ...prev, loading: false }));
      toast({
        variant: 'error',
        message: t('feedback.genericError'),
      });
    }
  }, [closeConfirm, toast]);

  const handleCancelPress = useCallback(() => {
    if (confirmState.loading) return;
    closeConfirm(false);
  }, [closeConfirm, confirmState.loading]);

  const value = useMemo(
    () => ({ confirm, toast, dismissToast }),
    [confirm, toast, dismissToast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <ConfirmDialog
          visible={confirmState.visible}
          title={confirmState.title}
          message={confirmState.message}
          impact={confirmState.impact}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          variant={confirmState.variant}
          loading={confirmState.loading}
          onConfirm={handleConfirmPress}
          onCancel={handleCancelPress}
        />
        <AppToast
          visible={toastState.visible}
          message={toastState.message}
          variant={toastState.variant}
          durationMs={toastState.durationMs}
          actionLabel={toastState.actionLabel}
          onAction={toastState.onAction}
          onDismiss={dismissToast}
        />
      </View>
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}
