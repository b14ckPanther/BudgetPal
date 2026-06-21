/**
 * BudgetPal — ReceiptPreviewCard Component
 * Receipt scan result preview with extracted data.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Receipt, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { getReceiptThumbnailUrl } from '@/services/receipts/scanReceipt';

interface ReceiptDuplicateWarning {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
}

interface ReceiptPreviewCardProps {
  receiptId: string;
  merchant: string;
  date: string;
  totalAmount: number | null;
  currency: string;
  category: string;
  subcategory?: string | null;
  confidence: number;
  items?: { name: string; price?: number | null; quantity?: number | null }[];
  requiresManualAmount?: boolean;
  uncertaintyNotes?: string | null;
  duplicateWarning?: ReceiptDuplicateWarning;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function ReceiptPreviewCard({
  receiptId,
  merchant,
  date,
  totalAmount,
  currency,
  category,
  subcategory,
  confidence,
  items,
  requiresManualAmount,
  uncertaintyNotes,
  duplicateWarning,
  onConfirm,
  onEdit,
  onCancel,
}: ReceiptPreviewCardProps) {
  const { colors, spacing, radius } = useTheme();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setThumbLoading(true);
    getReceiptThumbnailUrl(receiptId)
      .then((url) => {
        if (active) setThumbnailUrl(url);
      })
      .finally(() => {
        if (active) setThumbLoading(false);
      });
    return () => {
      active = false;
    };
  }, [receiptId]);

  const showUncertainty = !!uncertaintyNotes || confidence < 0.8 || requiresManualAmount;
  const confirmDisabled = requiresManualAmount || totalAmount == null || totalAmount <= 0;

  return (
    <Card variant="elevated" accentColor={colors.chart3}>
      <View style={styles.header}>
        <Receipt size={20} color={colors.chart3} />
        <Text variant="label" color={colors.chart3}>
          {t('cards.receiptPreview')}
        </Text>
      </View>

      <View style={[styles.thumbnailWrap, { marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.backgroundSoft }]}>
        {thumbLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.thumbnailLoader} />
        ) : thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : null}
      </View>

      {duplicateWarning && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warningSoft, marginTop: spacing.md, borderRadius: radius.md, padding: spacing.sm }]}>
          <AlertTriangle size={16} color={colors.warning} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text variant="caption" weight="medium" color={colors.warning}>
              {t('cards.receiptDuplicateWarning')}
            </Text>
            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xxs }}>
              {t('receipt.duplicateMessage', {
                amount: formatCurrency(duplicateWarning.amount, duplicateWarning.currency),
                merchant: duplicateWarning.merchant,
                date: formatDate(new Date(duplicateWarning.date)),
              })}
            </Text>
          </View>
        </View>
      )}

      {showUncertainty && (
        <Text variant="caption" color={colors.warning} style={{ marginTop: spacing.sm }}>
          {uncertaintyNotes || (requiresManualAmount ? t('receipt.missingTotal') : t('cards.receiptUncertainty'))}
        </Text>
      )}

      <View style={[styles.row, { marginTop: spacing.md }]}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.merchant')}</Text>
        <Text variant="bodySmall" weight="medium">{merchant || t('receipt.unknownMerchant')}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.date')}</Text>
        <Text variant="bodySmall" weight="medium">{formatDate(new Date(date))}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.amount')}</Text>
        {totalAmount != null && totalAmount > 0 ? (
          <MoneyAmount amount={totalAmount} currency={currency} size="sm" />
        ) : (
          <Text variant="bodySmall" weight="medium" color={colors.warning}>
            {t('receipt.missingTotal')}
          </Text>
        )}
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.category')}</Text>
        <Text variant="bodySmall" weight="medium">
          {subcategory ? `${category} / ${subcategory}` : category}
        </Text>
      </View>

      {items && items.length > 0 && (
        <View style={[styles.itemsSection, { marginTop: spacing.md }]}>
          <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
            {t('receipt.extractedItems')}
          </Text>
          {items.slice(0, 6).map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.row}>
              <Text variant="caption" numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                {item.name}
              </Text>
              {item.price != null && item.price > 0 ? (
                <MoneyAmount amount={item.price} currency={currency} size="sm" />
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        {onCancel && <Button label={t('common.cancel')} variant="ghost" size="sm" onPress={onCancel} />}
        {onEdit && <Button label={t('common.edit')} variant="secondary" size="sm" onPress={onEdit} />}
        {onConfirm && (
          <Button
            label={t('common.confirm')}
            variant="primary"
            size="sm"
            onPress={onConfirm}
            disabled={confirmDisabled}
          />
        )}
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
  thumbnailWrap: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailLoader: {
    flex: 1,
    alignSelf: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
