/**
 * BudgetPal — Card Component
 * Surface container with border, elevation, and glass variant.
 */

import React, { type ReactNode } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type CardVariant = 'default' | 'elevated' | 'glass' | 'outlined';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  accentColor?: string;
}

export function Card({
  children,
  variant = 'default',
  style,
  onPress,
  accentColor,
}: CardProps) {
  const { colors, radius, spacing } = useTheme();

  const variantStyles: Record<CardVariant, ViewStyle> = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    glass: {
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    variantStyles[variant],
    ...(accentColor
      ? [{ borderLeftWidth: 3 as const, borderLeftColor: accentColor }]
      : []),
    ...(style ? [style] : []),
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => [
          ...cardStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
