/**
 * BudgetPal — Screen Component
 * Safe-area wrapper with themed background.
 */

import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

type ScreenBackgroundVariant = 'default' | 'hero' | 'standard' | 'elevated' | 'profile';

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundVariant?: ScreenBackgroundVariant;
}

export function Screen({
  children,
  style,
  edges = ['top'],
  backgroundVariant = 'default',
}: ScreenProps) {
  const { colors } = useTheme();

  const getGradientColors = (): [string, string, ...string[]] | null => {
    switch (backgroundVariant) {
      case 'hero':
        return [colors.heroGradientStart, colors.heroGradientMiddle, colors.heroGradientEnd];
      case 'elevated':
        return [colors.aiSoft, colors.background];
      case 'standard':
        return [colors.backgroundSoft, colors.background];
      case 'profile':
        return [colors.backgroundSoft, colors.background];
      default:
        return null;
    }
  };

  const gradientColors = getGradientColors();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      <StatusBar style="light" />
      {gradientColors && (
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
