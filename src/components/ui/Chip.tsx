/**
 * BudgetPal — Chip Component
 * Selectable/pressable tag pill for filters and actions.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Chip({
  label,
  selected = false,
  onPress,
  color,
  style,
  icon,
}: ChipProps) {
  const { colors, radius, spacing } = useTheme();

  const activeColor = color || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          borderRadius: radius.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          backgroundColor: selected ? activeColor + '20' : colors.surfaceGlass,
          borderWidth: 1,
          borderColor: selected ? activeColor : colors.borderSoft,
        },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon}
      <Text
        variant="bodySmall"
        weight="medium"
        color={selected ? activeColor : colors.textSecondary}
        style={icon ? { marginLeft: spacing.xs } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
