/**
 * BudgetPal — TransactionPreviewCard Component
 * Shows transaction confirmation preview with details.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

interface TransactionPreviewCardProps {
  merchant?: string;
  title?: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
  confidence: number;
  source: string;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function TransactionPreviewCard({
  merchant,
  title,
  amount,
  category,
  date,
  type,
  confidence,
  source,
  onConfirm,
  onEdit,
  onCancel,
}: TransactionPreviewCardProps) {
  const { colors, spacing } = useTheme();

  const Icon = type === 'income' ? ArrowUpCircle : ArrowDownCircle;
  const iconColor = type === 'income' ? colors.success : colors.textPrimary;
  const displayLabel = title?.trim() || merchant?.trim() || 'Transaction';
  const detailLabel = merchant?.trim() ? t('cards.merchant') : t('cards.title');

  return (
    <Card variant="elevated" accentColor={colors.primary}>
      <View style={styles.header}>
        <Icon size={20} color={iconColor} />
        <Text variant="label" color={colors.primary}>
          {t('cards.transactionPreview')}
        </Text>
      </View>

      <View style={[styles.row, { marginTop: spacing.md }]}>
        <Text variant="bodySmall" color={colors.textMuted}>{detailLabel}</Text>
        <Text variant="bodySmall" weight="medium">{displayLabel}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.amount')}</Text>
        <MoneyAmount amount={amount} size="sm" type={type} showSign />
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.category')}</Text>
        <Text variant="bodySmall" weight="medium">{category}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.date')}</Text>
        <Text variant="bodySmall" weight="medium">{date}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.confidence')}</Text>
        <Text variant="bodySmall" weight="medium" color={colors.primary}>{Math.round(confidence * 100)}%</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.source')}</Text>
        <Text variant="bodySmall" weight="medium">{source}</Text>
      </View>

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        {onCancel && <Button label={t('common.cancel')} variant="ghost" size="sm" onPress={onCancel} />}
        {onEdit && <Button label={t('common.edit')} variant="secondary" size="sm" onPress={onEdit} />}
        {onConfirm && <Button label={t('common.confirm')} variant="primary" size="sm" onPress={onConfirm} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
