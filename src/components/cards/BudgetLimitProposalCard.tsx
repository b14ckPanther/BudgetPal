/**
 * BudgetPal — BudgetLimitProposalCard
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/currency';

interface BudgetLimitProposalCardProps {
  operation: 'set' | 'increase' | 'decrease' | 'move';
  categoryName: string;
  currentLimit: number;
  proposedLimit: number;
  amount: number;
  currency?: string;
  sourceCategoryName?: string;
  sourceCurrentLimit?: number;
  sourceProposedLimit?: number;
  targetCategoryName?: string;
  targetCurrentLimit?: number;
  targetProposedLimit?: number;
  createsNewLimit?: boolean;
  impactSummary?: string;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function BudgetLimitProposalCard({
  operation,
  categoryName,
  currentLimit,
  proposedLimit,
  amount,
  currency = 'ILS',
  sourceCategoryName,
  sourceCurrentLimit,
  sourceProposedLimit,
  targetCategoryName,
  targetCurrentLimit,
  targetProposedLimit,
  createsNewLimit,
  impactSummary,
  onConfirm,
  onEdit,
  onCancel,
}: BudgetLimitProposalCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.warning}>
      <View style={styles.header}>
        <SlidersHorizontal size={20} color={colors.warning} />
        <Text variant="label" color={colors.warning}>
          {t('cards.budgetLimitProposal')}
        </Text>
      </View>

      {operation === 'move' && sourceCategoryName && targetCategoryName ? (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{sourceCategoryName}</Text>
            <Text variant="bodySmall" weight="medium">
              {formatCurrency(sourceCurrentLimit || 0, currency)} → {formatCurrency(sourceProposedLimit || 0, currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{targetCategoryName}</Text>
            <Text variant="bodySmall" weight="medium">
              {formatCurrency(targetCurrentLimit || 0, currency)} → {formatCurrency(targetProposedLimit || 0, currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{t('cards.moveAmount')}</Text>
            <MoneyAmount amount={amount} currency={currency} size="sm" />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{t('cards.category')}</Text>
            <Text variant="bodySmall" weight="medium">{categoryName}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{t('cards.currentLimit')}</Text>
            <MoneyAmount amount={currentLimit} currency={currency} size="sm" />
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" color={colors.textMuted}>{t('cards.proposedLimit')}</Text>
            <MoneyAmount amount={proposedLimit} currency={currency} size="sm" color={colors.primary} />
          </View>
          {createsNewLimit && (
            <Text variant="caption" color={colors.warning}>
              {t('cards.createsNewLimit')}
            </Text>
          )}
        </View>
      )}

      {impactSummary && (
        <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
          {impactSummary}
        </Text>
      )}

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        {onCancel && <Button label={t('common.cancel')} variant="ghost" size="sm" onPress={onCancel} />}
        {onEdit && <Button label={t('common.edit')} variant="secondary" size="sm" onPress={onEdit} />}
        {onConfirm && <Button label={t('common.confirm')} variant="primary" size="sm" onPress={onConfirm} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
