/**
 * BudgetPal — Root Layout
 * App entry point with ThemeProvider, QueryClientProvider, font loading, and navigation setup.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme';
import { colors } from '@/theme/colors';
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
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
