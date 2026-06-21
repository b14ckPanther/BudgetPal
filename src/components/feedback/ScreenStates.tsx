/**
 * Shared screen-level loading, error, and empty states.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { AlertTriangle, Inbox } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text, Button } from '@/components/ui';
import { t } from '@/lib/i18n';

interface ScreenLoadingStateProps {
  message?: string;
}

export function ScreenLoadingState({ message }: ScreenLoadingStateProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
        {message || t('common.loading')}
      </Text>
    </View>
  );
}

interface ScreenErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ScreenErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  onRefresh,
  refreshing = false,
}: ScreenErrorStateProps) {
  const { colors, spacing } = useTheme();

  const content = (
    <View style={[styles.centered, { paddingHorizontal: spacing.xl }]}>
      <AlertTriangle size={48} color={colors.danger} />
      <Text variant="h3" align="center" style={{ marginTop: spacing.md }}>
        {title}
      </Text>
      <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
        {message}
      </Text>
      {onRetry && (
        <Button
          label={retryLabel || t('common.retry')}
          onPress={onRetry}
          style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
        />
      )}
    </View>
  );

  if (onRefresh) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollCentered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

interface ScreenEmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function ScreenEmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: ScreenEmptyStateProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.centered, { paddingHorizontal: spacing.xl }]}>
      {icon || <Inbox size={48} color={colors.textMuted} />}
      <Text variant="h3" align="center" color={colors.textPrimary} style={{ marginTop: spacing.md }}>
        {title}
      </Text>
      <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.sm }}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.xl }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
