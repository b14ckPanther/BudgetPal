/**
 * BudgetPal — SpendingAnalysisCard Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { t } from '@/lib/i18n';

interface SpendingBreakdownItem {
  name: string;
  amount: number;
  percentage: number;
}

interface SpendingAnalysisCardProps {
  periodLabel: string;
  totalSpent: number;
  currency?: string;
  breakdown: SpendingBreakdownItem[];
  topItem?: { name: string; amount: number };
  trend?: {
    previousPeriodLabel: string;
    previousTotal: number;
    changeAmount: number;
    changePercent: number;
  };
  explanation?: string;
  empty?: boolean;
  categoryFilterLabel?: string;
}

export function SpendingAnalysisCard({
  periodLabel,
  totalSpent,
  currency = 'ILS',
  breakdown,
  topItem,
  trend,
  explanation,
  empty,
  categoryFilterLabel,
}: SpendingAnalysisCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.ai}>
      <View style={styles.header}>
        <TrendingUp size={20} color={colors.ai} />
        <Text variant="label" color={colors.ai}>
          {t('cards.spendingAnalysis')}
        </Text>
      </View>

      <View style={[styles.totalRow, { marginTop: spacing.md }]}>
        <View>
          <Text variant="caption" color={colors.textMuted}>
            {categoryFilterLabel ? `${categoryFilterLabel} · ` : ''}{periodLabel}
          </Text>
          {empty ? (
            <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
              {t('cards.noSpendingData')}
            </Text>
          ) : (
            <MoneyAmount amount={totalSpent} currency={currency} size="md" color={colors.textPrimary} />
          )}
        </View>
      </View>

      {!empty && breakdown.length > 0 && (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {breakdown.slice(0, 6).map((cat) => (
            <View key={cat.name}>
              <View style={styles.catRow}>
                <Text variant="bodySmall" weight="medium">{cat.name}</Text>
                <MoneyAmount amount={cat.amount} currency={currency} size="sm" color={colors.textMuted} />
              </View>
              <ProgressBar progress={cat.percentage} style={{ marginTop: spacing.xs }} />
            </View>
          ))}
        </View>
      )}

      {topItem && !empty && (
        <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.md }}>
          {t('cards.topCategory')}: {topItem.name}
        </Text>
      )}

      {trend && !empty && (
        <Text variant="caption" color={colors.ai} style={{ marginTop: spacing.sm }}>
          vs {trend.previousPeriodLabel}: {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent}%
        </Text>
      )}

      {explanation && (
        <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
          {explanation}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
