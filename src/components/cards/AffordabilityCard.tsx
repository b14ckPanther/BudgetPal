/**
 * BudgetPal — AffordabilityCard Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircleDollarSign } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { t } from '@/lib/i18n';

export type AffordabilityVerdict =
  | 'safe'
  | 'caution'
  | 'not_recommended'
  | 'need_budget_setup';

interface AffordabilityCardProps {
  itemLabel: string;
  amount: number;
  currency?: string;
  verdict: AffordabilityVerdict;
  safeToSpend: number | null;
  safeToSpendAfter: number | null;
  categoryName?: string;
  categoryRemaining?: number;
  categoryLimit?: number;
  daysLeft?: number;
  reason: string;
}

const VERDICT_KEYS: Record<AffordabilityVerdict, string> = {
  safe: 'cards.verdictSafe',
  caution: 'cards.verdictCaution',
  not_recommended: 'cards.verdictNotRecommended',
  need_budget_setup: 'cards.verdictNeedSetup',
};

export function AffordabilityCard({
  itemLabel,
  amount,
  currency = 'ILS',
  verdict,
  safeToSpend,
  safeToSpendAfter,
  categoryName,
  categoryRemaining,
  reason,
}: AffordabilityCardProps) {
  const { colors, spacing } = useTheme();

  const statusColor =
    verdict === 'safe'
      ? colors.success
      : verdict === 'caution'
        ? colors.warning
        : verdict === 'need_budget_setup'
          ? colors.textMuted
          : colors.risk;

  const softColor =
    verdict === 'safe'
      ? colors.successSoft
      : verdict === 'caution'
        ? colors.warningSoft
        : verdict === 'need_budget_setup'
          ? colors.borderSoft
          : colors.riskSoft;

  return (
    <Card variant="elevated" accentColor={statusColor}>
      <View style={styles.header}>
        <CircleDollarSign size={20} color={statusColor} />
        <Text variant="label" color={statusColor}>
          {t('cards.affordability')}
        </Text>
      </View>

      <View style={[styles.itemRow, { marginTop: spacing.md }]}>
        <Text variant="bodySmall" weight="medium">{itemLabel}</Text>
        <MoneyAmount amount={amount} currency={currency} size="sm" color={colors.textPrimary} />
      </View>

      <View style={[styles.resultBox, { backgroundColor: softColor, marginTop: spacing.md }]}>
        <Text variant="bodySmall" weight="bold" color={statusColor}>
          {t(VERDICT_KEYS[verdict] as 'cards.verdictSafe')}
        </Text>
      </View>

      {safeToSpend !== null && (
        <>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <Text variant="caption" color={colors.textMuted}>{t('cards.safeToSpendNow')}</Text>
            <MoneyAmount amount={Math.floor(safeToSpend)} currency={currency} size="sm" color={colors.textSecondary} />
          </View>
          {safeToSpendAfter !== null && verdict !== 'need_budget_setup' && (
            <View style={styles.row}>
              <Text variant="caption" color={colors.textMuted}>{t('cards.safeToSpendAfter')}</Text>
              <MoneyAmount
                amount={Math.floor(safeToSpendAfter)}
                currency={currency}
                size="sm"
                color={safeToSpendAfter < 0 ? colors.danger : colors.textSecondary}
              />
            </View>
          )}
        </>
      )}

      {categoryName && categoryRemaining !== undefined && (
        <View style={[styles.row, { marginTop: spacing.xs }]}>
          <Text variant="caption" color={colors.textMuted}>{categoryName} {t('budget.remaining')}</Text>
          <MoneyAmount amount={categoryRemaining} currency={currency} size="sm" color={colors.textSecondary} />
        </View>
      )}

      <Text variant="bodySmall" style={{ marginTop: spacing.md }}>
        {reason}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultBox: { borderRadius: 8, padding: 10, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
});
