/**
 * BudgetPal — ReportCard Component
 * Report summary card with key metrics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { t } from '@/lib/i18n';

interface ReportCardProps {
  title: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  summary?: string;
  onPress?: () => void;
}

export function ReportCard({
  title,
  period,
  totalIncome,
  totalExpenses,
  netSavings,
  summary,
  onPress,
}: ReportCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" onPress={onPress}>
      <View style={styles.header}>
        <FileText size={20} color={colors.chart6} />
        <Text variant="label" color={colors.chart6}>
          {title}
        </Text>
      </View>

      <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        {period}
      </Text>

      <View style={[styles.metricsRow, { marginTop: spacing.md }]}>
        <View style={styles.metric}>
          <Text variant="caption" color={colors.textMuted}>{t('reports.totalIncome')}</Text>
          <MoneyAmount amount={totalIncome} size="sm" color={colors.success} />
        </View>
        <View style={styles.metric}>
          <Text variant="caption" color={colors.textMuted}>{t('reports.totalExpenses')}</Text>
          <MoneyAmount amount={totalExpenses} size="sm" color={colors.textPrimary} />
        </View>
        <View style={styles.metric}>
          <Text variant="caption" color={colors.textMuted}>{t('reports.netSavings')}</Text>
          <MoneyAmount amount={netSavings} size="sm" color={netSavings >= 0 ? colors.success : colors.danger} />
        </View>
      </View>

      {summary && (
        <Text variant="bodySmall" style={{ marginTop: spacing.md }}>
          {summary}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    gap: 4,
  },
});
