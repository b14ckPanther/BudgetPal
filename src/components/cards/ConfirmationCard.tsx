/**
 * BudgetPal — ConfirmationCard Component
 * Action confirmation with approve/reject buttons.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

interface ConfirmationCardProps {
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  onApprove?: () => void;
  onReject?: () => void;
}

export function ConfirmationCard({
  title,
  message,
  details,
  onApprove,
  onReject,
}: ConfirmationCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.warning}>
      <View style={styles.header}>
        <ShieldCheck size={20} color={colors.warning} />
        <Text variant="label" color={colors.warning}>
          {t('cards.confirmation')}
        </Text>
      </View>

      <Text variant="bodySmall" weight="medium" style={{ marginTop: spacing.md }}>
        {title}
      </Text>
      <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
        {message}
      </Text>

      {details && details.length > 0 && (
        <View style={[styles.details, { marginTop: spacing.md }]}>
          {details.map((detail, idx) => (
            <View key={idx} style={styles.row}>
              <Text variant="caption" color={colors.textMuted}>{detail.label}</Text>
              <Text variant="caption" weight="medium">{detail.value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        {onReject && <Button label={t('cards.reject')} variant="ghost" size="sm" onPress={onReject} />}
        {onApprove && <Button label={t('cards.approve')} variant="primary" size="sm" onPress={onApprove} />}
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
  details: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
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
