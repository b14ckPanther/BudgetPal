/**
 * BudgetPal — VoicePreviewCard Component
 * Voice interpretation preview showing transcription and parsed result.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

interface VoicePreviewCardProps {
  transcription: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  confidence: number;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function VoicePreviewCard({
  transcription,
  merchant,
  amount,
  category,
  date,
  confidence,
  onConfirm,
  onEdit,
  onCancel,
}: VoicePreviewCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.chart5}>
      <View style={styles.header}>
        <Mic size={20} color={colors.chart5} />
        <Text variant="label" color={colors.chart5}>
          {t('cards.voicePreview')}
        </Text>
      </View>

      <View style={[styles.transcriptionBox, { backgroundColor: colors.surfaceGlass, marginTop: spacing.md }]}>
        <Text variant="caption" color={colors.textMuted}>{t('cards.originalTranscription')}</Text>
        <Text variant="bodySmall" style={{ marginTop: spacing.xxs }}>
          &quot;{transcription}&quot;
        </Text>
      </View>

      <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.md }}>
        {t('cards.interpretedAs')}
      </Text>

      <View style={[styles.row, { marginTop: spacing.xs }]}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.merchant')}</Text>
        <Text variant="bodySmall" weight="medium">{merchant}</Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" color={colors.textMuted}>{t('cards.amount')}</Text>
        <MoneyAmount amount={amount} size="sm" type="expense" showSign />
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
  transcriptionBox: {
    borderRadius: 8,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
