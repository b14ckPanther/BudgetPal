/**
 * BudgetPal — MoneyAmount Component
 * Formatted currency display with symbol and styled amount.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { formatCurrency } from '@/lib/currency';

type MoneySize = 'sm' | 'md' | 'lg' | 'xl';

interface MoneyAmountProps {
  amount: number;
  currency?: string;
  size?: MoneySize;
  color?: string;
  showSign?: boolean;
  type?: 'expense' | 'income';
  style?: ViewStyle;
}

export function MoneyAmount({
  amount,
  currency = 'ILS',
  size = 'md',
  color,
  showSign = false,
  type,
  style,
}: MoneyAmountProps) {
  const { colors, typography } = useTheme();

  const sizeMap: Record<MoneySize, { fontSize: number; lineHeight: number }> = {
    sm: { fontSize: typography.size.sm, lineHeight: typography.lineHeight.sm },
    md: { fontSize: typography.size.lg, lineHeight: typography.lineHeight.lg },
    lg: { fontSize: typography.size.xxl, lineHeight: typography.lineHeight.xxl },
    xl: { fontSize: typography.size.display, lineHeight: typography.lineHeight.display },
  };

  const resolvedColor = color || (type === 'income' ? colors.success : type === 'expense' ? colors.textPrimary : colors.primary);
  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : '';
  const formatted = formatCurrency(Math.abs(amount), currency);

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          {
            fontFamily: typography.fontFamily.bold,
            fontSize: sizeMap[size].fontSize,
            lineHeight: sizeMap[size].lineHeight,
            color: resolvedColor,
          },
        ]}
      >
        {sign}{formatted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
