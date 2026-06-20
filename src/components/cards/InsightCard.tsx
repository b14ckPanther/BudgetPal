/**
 * BudgetPal — InsightCard Component
 * AI insight card with blue accent for agent intelligence display.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';

interface InsightCardProps {
  message: string;
  title?: string;
}

export function InsightCard({ message, title }: InsightCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="default" accentColor={colors.ai}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.aiSoft }]}>
          <Sparkles size={16} color={colors.ai} />
        </View>
        <Text variant="label" color={colors.ai}>
          {title || t('agent.aiInsights')}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ marginTop: spacing.sm }}>
        {message}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
