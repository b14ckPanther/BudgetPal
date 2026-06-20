/**
 * BudgetPal — Activity Screen
 * Transaction list from Supabase, source labels, filter chips, navigation to edit/new.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MessageSquare,
  Mic,
  Camera,
  PenLine,
  Bot,
  Plus,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, MoneyAmount, Chip, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { formatRelativeDate } from '@/lib/dates';
import { formatCategoryLabel } from '@/lib/categoryHierarchy';
import { useTransactions, useCurrentBudget } from '@/hooks/useBudgetQueries';
import { TransactionSource } from '@/types/api';

function SourceIcon({ source, color }: { source: TransactionSource; color: string }) {
  const size = 12;
  switch (source) {
    case 'text':
      return <MessageSquare size={size} color={color} />;
    case 'voice':
      return <Mic size={size} color={color} />;
    case 'receipt':
      return <Camera size={size} color={color} />;
    case 'manual':
      return <PenLine size={size} color={color} />;
    case 'agent':
    case 'import':
    default:
      return <Bot size={size} color={color} />;
  }
}

type FilterKey = 'all' | 'expenses' | 'income' | 'pending';

export default function ActivityScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // Queries
  const { data: budget } = useCurrentBudget();
  const { data: txs, isLoading, isError, refetch } = useTransactions();

  const currency = budget?.currency || 'ILS';

  // Filter transactions
  const processedTransactions = useMemo(() => {
    if (!txs) return [];
    
    // Exclude deleted, rejected, and duplicate transactions
    const activeTxs = txs.filter((tx) => tx.status !== 'deleted' && tx.status !== 'rejected' && tx.status !== 'duplicate');

    return activeTxs.filter((tx) => {
      if (activeFilter === 'expenses') return tx.type === 'expense' && tx.status === 'confirmed';
      if (activeFilter === 'income') return tx.type === 'income' && tx.status === 'confirmed';
      if (activeFilter === 'pending') return tx.status === 'pending_review';
      return true;
    });
  }, [txs, activeFilter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('activity.filters.all') },
    { key: 'expenses', label: t('activity.filters.expenses') },
    { key: 'income', label: t('activity.filters.income') },
    { key: 'pending', label: t('activity.filters.pending') },
  ];

  if (isLoading) {
    return (
      <Screen backgroundVariant="hero">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
            Loading transaction history...
          </Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen backgroundVariant="hero">
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <AlertTriangle size={48} color={colors.danger} />
          <Text variant="h3" style={{ marginTop: spacing.md }} color={colors.textPrimary}>
            Unable to load transactions
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
            Please try again. Pull down to refresh.
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  const hasTransactions = processedTransactions.length > 0;

  return (
    <Screen backgroundVariant="hero">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="h1" style={{ fontSize: 26, lineHeight: 32 }}>
                {t('activity.title')}
              </Text>
              <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                {t('activity.subtitle')}
              </Text>
            </View>
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              icon={<Plus size={14} color={colors.textPrimary} />}
              onPress={() => router.push('/transaction/new')}
            />
          </View>
        </View>

        {/* ── Filter Chips ─────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { marginTop: spacing.xl }]}
        >
          {filters.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={activeFilter === f.key}
              onPress={() => setActiveFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* ── Transaction List ─────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>
            {t('activity.transactions')}
          </Text>

          {!hasTransactions ? (
            <Card variant="glass" style={styles.emptyCard}>
              <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginBottom: spacing.md }}>
                No transactions found matching this filter.
              </Text>
              {activeFilter === 'all' && (
                <Button
                  label="Log First Transaction"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/transaction/new')}
                />
              )}
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {processedTransactions.map((tx) => {
                const txTitle = tx.title || tx.merchant || 'Untitled Transaction';
                const categoryLabel = formatCategoryLabel(tx.categoryName, tx.subcategoryName);
                return (
                  <Card
                    key={tx.id}
                    variant="default"
                    onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: tx.id } })}
                  >
                    <View style={styles.txRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.txHeader}>
                          <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
                            {txTitle}
                          </Text>
                          {tx.status === 'pending_review' && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.warningSoft }]}>
                              <Text variant="caption" color={colors.warning} style={{ fontSize: 9 }}>
                                Pending
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.txMeta, { marginTop: spacing.xxs }]}>
                          <Text variant="caption" color={colors.textMuted}>
                            {categoryLabel}
                          </Text>
                          <View style={[styles.sourceTag, { backgroundColor: colors.surfaceGlass }]}>
                            <SourceIcon source={tx.source} color={colors.textMuted} />
                            <Text variant="caption" color={colors.textMuted} style={{ marginLeft: 3, fontSize: 10 }}>
                              {tx.source}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <MoneyAmount
                          amount={tx.amount}
                          currency={tx.currency || currency}
                          size="sm"
                          type={tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : undefined}
                          showSign
                          color={tx.type === 'income' ? colors.success : colors.textPrimary}
                        />
                        <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                          {formatRelativeDate(tx.date)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: spacing.xxxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  filterRow: {
    gap: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
