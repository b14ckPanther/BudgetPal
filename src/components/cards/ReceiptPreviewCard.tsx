/**
 * BudgetPal — ReceiptPreviewCard Component
 * Receipt scan result preview with extracted data.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

interface ReceiptPreviewCardProps {
  merchant: string;
  date: string;
  totalAmount: number;
  category: string;
  confidence: number;
  items?: { name: string; price: number }[];
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function ReceiptPreviewCard({
  merchant,
  date,
  totalAmount,
  category,
  confidence,
  items,
  onConfirm,
  onEdit,
  onCancel,
}: ReceiptPreviewCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.chart3}>
      <View style={styles.header}>
        <Receipt size={20} color={colors.chart3} />
        <Text variant="label" color={colors.chart3}>
          {t('cards.receiptPreview')}
        </Text>
      </View>

      <View style={[styles.row, { marginTop: spacing.md }]}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.merchant')}</Text>
        <Text variant="bodySmall" weight="medium">{merchant}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.date')}</Text>
        <Text variant="bodySmall" weight="medium">{date}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.amount')}</Text>
        <MoneyAmount amount={totalAmount} size="sm" />
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.category')}</Text>
        <Text variant="bodySmall" weight="medium">{category}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.confidence')}</Text>
        <Text variant="bodySmall" weight="medium" color={colors.primary}>{Math.round(confidence * 100)}%</Text>
      </View>

      {items && items.length > 0 && (
        <View style={[styles.itemsSection, { marginTop: spacing.md }]}>
          <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
            Extracted items
          </Text>
          {items.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text variant="caption">{item.name}</Text>
              <Text variant="caption" weight="medium">{'\u20AA'}{item.price}</Text>
            </View>
          ))}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
