/**
 * BudgetPal — Budget Screen
 * Budget cycle, income, safe-to-spend, category progress, limit management modal.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import { Calendar, PenLine, Plus, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, MoneyAmount, ProgressBar, Input, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { useFeedback } from '@/components/feedback';
import { formatCurrency } from '@/lib/currency';
import { useCurrentBudget, useBudgetSummary, useUpdateCategoryLimit } from '@/hooks/useBudgetQueries';

interface EditLimitModalProps {
  visible: boolean;
  categoryName: string;
  currentLimit: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}

function EditLimitModal({ visible, categoryName, currentLimit, onClose, onSave }: EditLimitModalProps) {
  const { colors, spacing, radius } = useTheme();
  const { toast } = useFeedback();
  const [value, setValue] = useState(currentLimit > 0 ? String(currentLimit) : '');

  const handleSave = () => {
    const num = Number(value.trim());
    if (isNaN(num) || num < 0) {
      toast({ variant: 'warning', message: t('feedback.invalidLimit') });
      return;
    }
    onSave(num);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl }]}>
          <Text variant="h3" style={{ marginBottom: spacing.sm }}>
            Set Limit for {categoryName}
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
            Specify the maximum monthly budget limit for this category.
          </Text>
          <Input
            label="Monthly Limit Amount"
            placeholder="e.g. 500"
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
          />
          <View style={[styles.modalActions, { marginTop: spacing.xl }]}>
            <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Save Limit" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function BudgetScreen() {
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();

  // Queries
  const { data: budget, isLoading: isBudgetLoading } = useCurrentBudget();
  const { data: summary, isLoading: isSummaryLoading, isError, refetch } = useBudgetSummary();
  const updateLimitMutation = useUpdateCategoryLimit();

  // Modal State
  const [selectedCat, setSelectedCat] = useState<{ id: string; name: string; currentLimit: number } | null>(null);

  const isLoading = isBudgetLoading || isSummaryLoading;

  if (isLoading) {
    return (
      <Screen backgroundVariant="hero">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
            Loading your budget configurations...
          </Text>
        </View>
      </Screen>
    );
  }

  if (isError || !budget || !summary) {
    return (
      <Screen backgroundVariant="hero">
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <AlertTriangle size={48} color={colors.danger} />
          <Text variant="h3" style={{ marginTop: spacing.md }} color={colors.textPrimary}>
            Failed to load active budget
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
            Please make sure you have completed the onboarding flow and pull down to refresh.
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  // Group categories into budgeted and unbudgeted
  const budgetedCategories = summary.categories.filter((c) => c.limit > 0);
  const unbudgetedCategories = summary.categories.filter((c) => c.limit === 0);

  const hasLimits = budgetedCategories.length > 0;
  const overallProgress = summary.overallLimit > 0 
    ? Math.min(100, Math.round((summary.overallSpent / summary.overallLimit) * 100))
    : 0;

  const handleSaveLimit = async (amount: number) => {
    if (!selectedCat) return;
    try {
      await updateLimitMutation.mutateAsync({
        budgetId: budget.id,
        categoryId: selectedCat.id,
        limit: amount,
      });
      setSelectedCat(null);
      refetch();
      toast({ variant: 'success', message: t('feedback.budgetLimitUpdated') });
    } catch (err: unknown) {
      if (__DEV__) console.error('Update limit failed:', err);
      toast({ variant: 'error', message: t('feedback.budgetLimitUpdateFailed') });
    }
  };

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
                {t('budget.title')}
              </Text>
              <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                Active: {budget.name}
              </Text>
            </View>
            {hasLimits && (
              <View style={[styles.statusChip, { backgroundColor: overallProgress >= 100 ? colors.dangerSoft : colors.successSoft }]}>
                <Text variant="caption" color={overallProgress >= 100 ? colors.danger : colors.success} weight="medium" style={{ fontSize: 11 }}>
                  {overallProgress >= 100 ? 'Over Limit' : t('budget.onTrack')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Budget Cycle Card ────────────────────── */}
        <Card variant="glass" style={{ marginTop: spacing.xl }}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Calendar size={16} color={colors.textMuted} />
              <Text variant="label" color={colors.textMuted} style={{ marginLeft: spacing.sm }}>
                {t('budget.budgetCycle')}
              </Text>
            </View>
            <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
              {summary.cycleStart} - {summary.cycleEnd}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <Text variant="caption" color={colors.textMuted}>
              {summary.daysLeft} {t('budget.daysLeft')}
            </Text>
            {hasLimits && (
              <Text variant="caption" color={colors.textMuted}>
                {overallProgress}% {t('budget.spent')}
              </Text>
            )}
          </View>
          {hasLimits && <ProgressBar progress={overallProgress} style={{ marginTop: spacing.sm }} />}
        </Card>

        {/* ── Monthly Income & Safe to Spend Row ──── */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Card variant="default" style={{ flex: 1, padding: spacing.md }}>
            <Text variant="caption" color={colors.textMuted}>{t('budget.monthlyIncome')}</Text>
            <MoneyAmount amount={summary.monthlyIncome} currency={budget.currency} size="md" color={colors.success} style={{ marginTop: spacing.xxs }} />
          </Card>
          <Card variant="elevated" style={{ flex: 1, padding: spacing.md, borderColor: colors.primaryGlow }}>
            <Text variant="caption" color={colors.textMuted}>{t('budget.safeToSpendToday')}</Text>
            {summary.safeToSpend !== null ? (
              <MoneyAmount amount={Math.floor(summary.safeToSpend)} currency={budget.currency} size="md" color={colors.primary} style={{ marginTop: spacing.xxs }} />
            ) : (
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                No limits configured
              </Text>
            )}
          </Card>
        </View>

        {/* ── Setup/Empty State if no Limits configured ──── */}
        {!hasLimits && (
          <Card variant="glass" style={StyleSheet.flatten([styles.setupCard, { marginTop: spacing.xl }])}>
            <Text variant="h3" color={colors.primary} style={{ marginBottom: spacing.xs }}>
              Configure Spending Limits
            </Text>
            <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginBottom: spacing.lg }}>
              Set up monthly limits for your expense categories below to activate your Daily Safe-to-Spend limit and track category budgets.
            </Text>
          </Card>
        )}

        {/* ── Budgeted Category Progress ────────────────────── */}
        {hasLimits && (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 11 }}>
              {t('budget.categoryBudgets')}
            </Text>
            <View style={{ gap: spacing.sm }}>
              {budgetedCategories.map((cat) => {
                const remaining = cat.limit - cat.spent;
                const isOver = remaining < 0;
                const statusColor = cat.percentage >= 100
                  ? colors.danger
                  : cat.percentage >= 85
                    ? colors.risk
                    : cat.percentage >= 75
                      ? colors.warning
                      : colors.primary;

                return (
                  <Card
                    key={cat.categoryId}
                    variant="default"
                    style={{ padding: spacing.md }}
                    onPress={() => setSelectedCat({ id: cat.categoryId, name: cat.name, currentLimit: cat.limit })}
                  >
                    <View style={styles.catRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.row}>
                          <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>{cat.name}</Text>
                          <PenLine size={13} color={colors.textMuted} />
                        </View>
                        <View style={[styles.catMeta, { marginTop: spacing.xs }]}>
                          <Text variant="caption" color={colors.textMuted}>
                            {formatCurrency(cat.spent, budget.currency)} / {formatCurrency(cat.limit, budget.currency)}
                          </Text>
                          <Text variant="caption" weight="medium" color={statusColor}>
                            {isOver
                              ? t('budget.overBudget')
                              : cat.percentage >= 85
                                ? t('budget.nearLimit')
                                : `${formatCurrency(remaining, budget.currency)} ${t('budget.remaining')}`}
                          </Text>
                        </View>
                        <ProgressBar progress={cat.percentage} style={{ marginTop: spacing.sm }} />
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Unbudgeted Expense Categories ────────────────── */}
        {unbudgetedCategories.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 11 }}>
              Unbudgeted Categories
            </Text>
            <View style={{ gap: spacing.sm }}>
              {unbudgetedCategories.map((cat) => (
                <Card
                  key={cat.categoryId}
                  variant="default"
                  style={{ padding: spacing.md }}
                  onPress={() => setSelectedCat({ id: cat.categoryId, name: cat.name, currentLimit: 0 })}
                >
                  <View style={styles.unbudgetedRow}>
                    <View>
                      <Text variant="bodySmall" weight="medium" color={colors.textSecondary}>{cat.name}</Text>
                      {cat.spent > 0 && (
                        <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                          Spent {formatCurrency(cat.spent, budget.currency)} this cycle
                        </Text>
                      )}
                    </View>
                    <View style={[styles.addLimitBadge, { borderColor: colors.border }]}>
                      <Plus size={12} color={colors.primary} />
                      <Text variant="caption" color={colors.primary} weight="bold" style={{ marginLeft: 4 }}>
                        Limit
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxxxl }} />
      </ScrollView>

      {/* Limit Editor Modal */}
      {selectedCat && (
        <EditLimitModal
          visible={!!selectedCat}
          categoryName={selectedCat.name}
          currentLimit={selectedCat.currentLimit}
          onClose={() => setSelectedCat(null)}
          onSave={handleSaveLimit}
        />
      )}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  setupCard: {
    padding: 24,
    alignItems: 'center',
  },
  unbudgetedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    elevation: 5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
