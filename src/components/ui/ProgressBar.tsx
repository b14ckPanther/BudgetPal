/**
 * BudgetPal — ProgressBar Component
 * Animated category progress with color states based on percentage.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

/**
 * Get semantic color for a budget percentage.
 */
function getProgressColor(progress: number, colors: ReturnType<typeof useTheme>['colors']): string {
  if (progress >= 100) return colors.danger;
  if (progress >= 85) return colors.risk;
  if (progress >= 75) return colors.warning;
  return colors.primary;
}

export function ProgressBar({
  progress,
  color,
  height = 6,
  style,
}: ProgressBarProps) {
  const { colors, radius } = useTheme();

  const fillColor = color || getProgressColor(progress, colors);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: radius.full,
          backgroundColor: colors.white10,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            borderRadius: radius.full,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
