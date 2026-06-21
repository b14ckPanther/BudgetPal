/**
 * BudgetPal — Root Layout
 */

import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme';
import { LocaleProvider, LocalePreferenceSync, LocaleRestartDialog } from '@/components/locale';
import { ThemePreferenceSync } from '@/components/theme/ThemePreferenceSync';
import { FeedbackProvider, SessionRecoveryBootstrap } from '@/components/feedback';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <FeedbackProvider>
            <SessionRecoveryBootstrap />
            <LocalePreferenceSync />
            <LocaleRestartDialog />
            <ThemePreferenceSync />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
            />
          </FeedbackProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
