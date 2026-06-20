/**
 * BudgetPal — QuickActionChip Component
 * Quick action buttons for agent screen (voice, scan, analyze, etc.).
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

interface QuickActionChipProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function QuickActionChip({
  label,
  icon,
  onPress,
  style,
}: QuickActionChipProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.borderSoft,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        pressed && { opacity: 0.8, backgroundColor: colors.white10 },
        style,
      ]}
    >
      {icon}
      <Text
        variant="bodySmall"
        weight="medium"
        color={colors.textSecondary}
        style={{ marginLeft: spacing.sm }}
        numberOfLines={1}
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
    borderWidth: 1,
  },
});
