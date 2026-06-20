/**
 * BudgetPal — Reports Screen
 * Premium empty state placeholder for future report features.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Bot } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, Button } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function ReportsScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <Screen backgroundVariant="hero">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="h1" style={{ fontSize: 26, lineHeight: 32 }}>
                {t('reports.title')}
              </Text>
              <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                {t('reports.subtitle')}
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: colors.aiSoft }]}>
              <Bot size={12} color={colors.ai} />
              <Text variant="caption" color={colors.ai} weight="medium" style={{ fontSize: 11, marginLeft: 4 }}>
                Copilot
              </Text>
            </View>
          </View>
        </View>

        {/* ── Empty State ─────────────────────────── */}
        <Card variant="glass" style={styles.emptyCard}>
          <FileText size={48} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text variant="h3" color={colors.primary} align="center" style={{ marginBottom: spacing.sm }}>
            Reports Coming Soon
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.sm }}>
            Financial reports, weekly spending breakdowns, and AI-powered saving trends will become available in the next phase once your budget history builds up.
          </Text>
          <Button
            label="Go to Command Center"
            onPress={() => router.replace('/(tabs)/agent')}
          />
        </Card>

        <View style={{ height: spacing.xxxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyCard: {
    marginTop: 40,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
