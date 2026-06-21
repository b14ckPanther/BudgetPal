/**
 * BudgetPal — Themed confirmation dialog.
 */

import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

export type ConfirmVariant = 'default' | 'destructive';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  impact?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  impact,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        onPress={loading ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderSoft,
              borderRadius: radius.lg,
              padding: spacing.xl,
              marginHorizontal: spacing.xl,
            },
          ]}
          accessibilityViewIsModal
        >
          <Text variant="h3" color={colors.textPrimary}>
            {title}
          </Text>
          <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            {message}
          </Text>
          {impact ? (
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
              {impact}
            </Text>
          ) : null}

          <View style={[styles.actions, { marginTop: spacing.xl, gap: spacing.sm }]}>
            <Button
              label={cancelLabel || t('common.cancel')}
              variant="ghost"
              onPress={onCancel}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              label={confirmLabel || t('common.confirm')}
              variant={variant === 'destructive' ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              disabled={loading}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
  },
  dialog: {
    borderWidth: 1,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
  },
});
