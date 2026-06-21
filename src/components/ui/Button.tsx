/**
 * BudgetPal — Button Component
 * Premium button with variants: primary, secondary, ghost, danger.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  icon,
}: ButtonProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: colors.primary,
      },
      text: {
        color: colors.textInverse,
      },
    },
    secondary: {
      container: {
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
      },
      text: {
        color: colors.textPrimary,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: {
        color: colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: colors.danger,
      },
      text: {
        color: colors.danger,
      },
    },
  };

  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
      container: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.sm,
      },
      text: {
        fontSize: typography.size.sm,
      },
    },
    md: {
      container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
      },
      text: {
        fontSize: typography.size.md,
      },
    },
    lg: {
      container: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        borderRadius: radius.lg,
      },
      text: {
        fontSize: typography.size.lg,
      },
    },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        vs.container,
        ss.container,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textInverse : colors.textPrimary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            variant="label"
            weight="medium"
            style={[vs.text, ss.text, icon ? { marginStart: spacing.sm } : undefined]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
