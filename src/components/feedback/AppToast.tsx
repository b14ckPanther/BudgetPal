/**
 * BudgetPal — Non-blocking themed feedback toast.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface AppToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function AppToast({
  visible,
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
  durationMs,
}: AppToastProps) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  const variantStyles: Record<ToastVariant, { bg: string; border: string; accent: string; Icon: typeof Info }> = {
    success: { bg: colors.successSoft, border: colors.success, accent: colors.success, Icon: CheckCircle2 },
    info: { bg: colors.infoSoft, border: colors.info, accent: colors.info, Icon: Info },
    warning: { bg: colors.warningSoft, border: colors.warning, accent: colors.warning, Icon: AlertTriangle },
    error: { bg: colors.dangerSoft, border: colors.danger, accent: colors.danger, Icon: XCircle },
  };

  const vs = variantStyles[variant];
  const autoDismiss = durationMs ?? (variant === 'error' ? 4500 : variant === 'warning' ? 4000 : 3000);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      return;
    }

    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, autoDismiss);

    return () => clearTimeout(timer);
  }, [visible, message, autoDismiss, onDismiss, opacity]);

  if (!visible) return null;

  const Icon = vs.Icon;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: vs.bg,
            borderColor: vs.border,
            borderRadius: radius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icon size={18} color={vs.accent} />
        <Text variant="bodySmall" color={colors.textPrimary} style={{ flex: 1, marginLeft: spacing.sm }}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
            <Text variant="caption" weight="bold" color={vs.accent}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
