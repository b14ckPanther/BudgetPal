/**
 * BudgetPal — IconButton Component
 * Circular icon-only button with themed styling.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type IconButtonSize = 'sm' | 'md' | 'lg';
type IconButtonVariant = 'default' | 'primary' | 'glass';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  style,
  disabled = false,
}: IconButtonProps) {
  const { colors, radius } = useTheme();

  const sizeMap: Record<IconButtonSize, number> = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const variantStyles: Record<IconButtonVariant, ViewStyle> = {
    default: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    primary: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    glass: {
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
  };

  const dimension = sizeMap[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        variantStyles[variant],
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
        },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
