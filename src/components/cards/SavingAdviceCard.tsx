/**
 * BudgetPal — SavingAdviceCard (deterministic advice display)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';

interface SavingAdviceCardProps {
  observation: string;
  actions: string[];
  empty?: boolean;
}

export function SavingAdviceCard({ observation, actions, empty }: SavingAdviceCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="elevated" accentColor={colors.primary}>
      <View style={styles.header}>
        <Lightbulb size={20} color={colors.primary} />
        <Text variant="label" color={colors.primary}>
          {t('cards.savingAdvice')}
        </Text>
      </View>

      <Text variant="bodySmall" style={{ marginTop: spacing.md }}>
        {observation}
      </Text>

      {!empty && actions.length > 0 && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text variant="caption" color={colors.textMuted} weight="bold">
            {t('cards.suggestedActions')}
          </Text>
          {actions.map((action, idx) => (
            <View key={idx} style={styles.actionRow}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>
                {action}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 4, height: 14, borderRadius: 2, marginTop: 3 },
});
