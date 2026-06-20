/**
 * BudgetPal — WarningCard Component
 * Budget warning card with amber/orange accent.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';

type WarningLevel = 'info' | 'attention' | 'warning' | 'critical';

interface WarningCardProps {
  message: string;
  level?: WarningLevel;
  title?: string;
}

export function WarningCard({ message, level = 'warning', title }: WarningCardProps) {
  const { colors, spacing } = useTheme();

  const levelColors: Record<WarningLevel, { accent: string; soft: string }> = {
    info: { accent: colors.info, soft: colors.infoSoft },
    attention: { accent: colors.warning, soft: colors.warningSoft },
    warning: { accent: colors.risk, soft: colors.riskSoft },
    critical: { accent: colors.danger, soft: colors.dangerSoft },
  };

  const { accent, soft } = levelColors[level];

  return (
    <Card variant="default" accentColor={accent}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: soft }]}>
          <AlertTriangle size={16} color={accent} />
        </View>
        <Text variant="label" color={accent}>
          {title || t('agent.recentWarnings')}
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
