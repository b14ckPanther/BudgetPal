/**
 * BudgetPal — Agent Screen (Hero Screen)
 * Agent Command Center: the first and most important screen.
 * Greeting, input bar, quick actions, budget snapshot, insights, warnings, result cards.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Mic,
  Camera,
  TrendingUp,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, ProgressBar, Button } from '@/components/ui';
import { AgentInputBar, QuickActionChip, AgentMessageBubble } from '@/components/agent';
import { TransactionPreviewCard } from '@/components/cards/TransactionPreviewCard';
import { SpendingAnalysisCard } from '@/components/cards/SpendingAnalysisCard';
import { AffordabilityCard } from '@/components/cards/AffordabilityCard';
import { SavingAdviceCard } from '@/components/cards/SavingAdviceCard';
import { BudgetLimitProposalCard } from '@/components/cards/BudgetLimitProposalCard';
import { t } from '@/lib/i18n';
import { useCurrentProfile, useBudgetSummary, useTransactions } from '@/hooks/useBudgetQueries';
import { formatCurrency } from '@/lib/currency';
import { formatCategoryLabel } from '@/lib/categoryHierarchy';
import { supabase } from '@/lib/supabase';
import { getAgentMessages, sendMessageToAgent, confirmAgentAction, cancelAgentAction } from '@/services/agent';
import { AgentMessage } from '@/types/agent';

export default function AgentScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Queries
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError, refetch } = useBudgetSummary();
  const { data: txs, isLoading: isTxLoading } = useTransactions();

  // Local Agent Conversation States
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [processedActions, setProcessedActions] = useState<Record<string, 'confirmed' | 'cancelled'>>({});

  // Load message history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getAgentMessages();
        setMessages(history);
      } catch (err) {
        console.error('Failed to load message history:', err);
      }
    }
    loadHistory();
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return t('agent.greetingMorning') || 'Good morning';
    if (hrs < 18) return t('agent.greetingAfternoon') || 'Good afternoon';
    return t('agent.greetingEvening') || 'Good evening';
  };

  const greeting = getGreeting();
  const displayName = profile?.firstName || 'there';

  const isLoading = isProfileLoading || isSummaryLoading || isTxLoading;

  // Filter non-deleted transactions to check if empty
  const activeTransactions = useMemo(() => {
    return (txs || []).filter(tx => tx.status !== 'deleted' && tx.status !== 'rejected');
  }, [txs]);

  const hasTransactions = activeTransactions.length > 0;

  // Handle send message
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInputValue('');

    const userMessageText = text.trim();
    const tempUserMsgId = `user-${Date.now()}`;
    const userMsg: AgentMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: userMessageText,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update list
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await sendMessageToAgent(userMessageText);

      const agentMsg: AgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: response.message,
        intent: response.intent,
        confidence: response.confidence,
        cards: response.cards,
        suggestedPrompts: response.suggestedPrompts,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Failed to send message to agent:', err);
      Alert.alert(t('agent.sendError') || 'Error', err.message || 'Could not communicate with the agent.');
      
      // Add error system/agent message
      const errorMsg: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle confirm action
  const handleConfirmAction = async (actionId: string) => {
    try {
      await confirmAgentAction(actionId);
      setProcessedActions(prev => ({ ...prev, [actionId]: 'confirmed' }));
      Alert.alert(t('common.confirm') || 'Confirmed', t('agent.actionConfirmSuccess') || 'Action completed successfully!');
      
      // Invalidate queries to refresh budget state and activity tab
      queryClient.invalidateQueries();
    } catch (err: any) {
      console.error('Failed to confirm agent action:', err);
      Alert.alert(t('agent.confirmError') || 'Error', err.message || 'Could not confirm transaction.');
    }
  };

  // Handle cancel action
  const handleCancelAction = async (actionId: string) => {
    try {
      await cancelAgentAction(actionId);
      setProcessedActions(prev => ({ ...prev, [actionId]: 'cancelled' }));
      Alert.alert(t('common.cancel') || 'Cancelled', t('agent.cancelSuccess') || 'Proposal cancelled.');
    } catch (err: any) {
      console.error('Failed to cancel agent action:', err);
      Alert.alert(t('agent.cancelError') || 'Error', err.message || 'Could not cancel action.');
    }
  };

  const handleEditBudgetLimit = (proposal: Record<string, unknown>) => {
    router.push('/(tabs)/budget');
  };

  const renderProcessedBanner = (actionId: string, isProcessed: 'confirmed' | 'cancelled') => (
    <View
      style={[
        styles.statusBanner,
        {
          backgroundColor: isProcessed === 'confirmed' ? colors.successSoft : colors.borderSoft,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginTop: spacing.xs,
          borderColor: isProcessed === 'confirmed' ? colors.success : colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <Text
        variant="caption"
        color={isProcessed === 'confirmed' ? colors.success : colors.textSecondary}
        weight="bold"
        align="center"
      >
        {isProcessed === 'confirmed' ? t('agent.proposalConfirmed') : t('agent.proposalCancelled')}
      </Text>
    </View>
  );

  const handleEditAction = (proposal: Record<string, unknown>) => {
    router.push({
      pathname: '/transaction/new',
      params: {
        amount: proposal.amount?.toString(),
        merchant: (proposal.merchant as string) || '',
        title: proposal.title as string,
        categoryId: proposal.categoryId as string,
        categoryName: proposal.categoryName as string,
        subcategoryId: proposal.subcategoryId as string,
        subcategoryName: proposal.subcategoryName as string,
        date: proposal.date as string,
        type: proposal.type as string,
        note: proposal.note as string,
      },
    });
  };

  // Handle clear chat history
  const handleClearChat = async () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to clear all conversation history with your agent? This will not delete your saved transactions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from('agent_messages').delete().eq('user_id', user.id);
                await supabase.from('agent_actions').delete().eq('user_id', user.id);
                setMessages([]);
                setProcessedActions({});
              }
            } catch (err) {
              console.error('Error clearing chat history:', err);
            }
          }
        }
      ]
    );
  };

  // Handle Quick Action Clicks
  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'voiceExpense') {
      Alert.alert("Voice Expense", "Voice transcription is coming in a later phase. For now, please type your transaction details.");
    } else if (actionKey === 'scanReceipt') {
      Alert.alert("Scan Receipt", "Receipt scanning is coming in a later phase. For now, please type your transaction details.");
    } else if (actionKey === 'analyzeSpending') {
      handleSend('What did I spend most on this month?');
    } else if (actionKey === 'canIAfford') {
      setInputValue('Can I afford ');
    } else if (actionKey === 'generateReport') {
      Alert.alert("Generate Report", "PDF reports and structured statements are coming soon in Phase 5! View your reports list in the Reports tab.");
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundVariant="hero">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
            Waking up your personal budget agent...
          </Text>
        </View>
      </Screen>
    );
  }

  if (isSummaryError) {
    return (
      <Screen backgroundVariant="hero">
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          <AlertTriangle size={48} color={colors.danger} />
          <Text variant="h3" style={{ marginTop: spacing.md }} color={colors.textPrimary}>
            Unable to load your agent data
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
            Please check your connection and pull down to refresh.
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen backgroundVariant="hero">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* ── Brand & Status Row ────────────────────── */}
        <View style={styles.brandRow}>
          <Text variant="caption" weight="bold" color={colors.textPrimary} style={{ letterSpacing: 2, opacity: 0.8 }}>
            BUDGETPAL
          </Text>
          <View style={[styles.agentStatusBadge, { backgroundColor: colors.primarySoft }]}>
            <View style={[styles.pulsingDot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" weight="medium" color={colors.primary} style={{ fontSize: 11 }}>
              {t('common.agentActive')}
            </Text>
          </View>
        </View>

        {/* ── Greeting ─────────────────────────────── */}
        <View style={[styles.greetingSection, { marginTop: spacing.md }]}>
          <Text variant="h1" style={{ fontSize: 30, lineHeight: 36 }}>
            {greeting}, {displayName}
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xxs, opacity: 0.9 }}>
            {t('agent.prompt')}
          </Text>
        </View>

        {/* ── Agent Input Bar ──────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <AgentInputBar
            value={inputValue}
            onChangeText={setInputValue}
            onSend={handleSend}
            loading={isSending}
          />
        </View>

        {/* ── Quick Actions ────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickActions, { marginTop: spacing.md }]}
        >
          <QuickActionChip
            label={t('agent.quickActions.voiceExpense')}
            icon={<Mic size={15} color={colors.chart5} />}
            onPress={() => handleQuickAction('voiceExpense')}
          />
          <QuickActionChip
            label={t('agent.quickActions.scanReceipt')}
            icon={<Camera size={15} color={colors.chart3} />}
            onPress={() => handleQuickAction('scanReceipt')}
          />
          <QuickActionChip
            label={t('agent.quickActions.analyzeSpending')}
            icon={<TrendingUp size={15} color={colors.ai} />}
            onPress={() => handleQuickAction('analyzeSpending')}
          />
          <QuickActionChip
            label={t('agent.quickActions.canIAfford')}
            icon={<CircleDollarSign size={15} color={colors.success} />}
            onPress={() => handleQuickAction('canIAfford')}
          />
          <QuickActionChip
            label={t('agent.quickActions.generateReport')}
            icon={<FileText size={15} color={colors.chart6} />}
            onPress={() => handleQuickAction('generateReport')}
          />
        </ScrollView>

        {/* ── Conversation History (Inline Chat) ────────── */}
        {messages.length > 0 && (
          <View style={[styles.chatSection, { marginTop: spacing.xl }]}>
            <View style={styles.chatHeader}>
              <Text variant="caption" weight="bold" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>
                CONVERSATION
              </Text>
              <Pressable onPress={handleClearChat} hitSlop={8}>
                <Text variant="caption" color={colors.primary} weight="bold">
                  Clear History
                </Text>
              </Pressable>
            </View>
            <View style={[styles.chatContainer, { marginTop: spacing.md }]}>
              {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                return (
                  <View key={msg.id || `msg-${index}`}>
                    <AgentMessageBubble
                      message={msg}
                      isLastMessage={isLast}
                      onPromptPress={(prompt) => {
                        setInputValue(prompt);
                      }}
                    />
                    {msg.cards && msg.cards.map((card, cardIdx) => {
                      const data = card.data as Record<string, unknown>;
                      const cardKey = `${msg.id}-card-${cardIdx}`;

                      if (card.type === 'transaction_preview') {
                        const actionId = data.actionId as string;
                        const isProcessed = processedActions[actionId];
                        return (
                          <View key={cardKey} style={{ marginVertical: spacing.sm }}>
                            <TransactionPreviewCard
                              merchant={data.merchant as string}
                              title={data.title as string}
                              amount={data.amount as number}
                              category={formatCategoryLabel(
                                data.categoryName as string,
                                data.subcategoryName as string
                              )}
                              date={data.date as string}
                              type={data.type as 'expense' | 'income'}
                              confidence={data.confidence as number}
                              source="text"
                              onConfirm={isProcessed ? undefined : () => handleConfirmAction(actionId)}
                              onCancel={isProcessed ? undefined : () => handleCancelAction(actionId)}
                              onEdit={isProcessed ? undefined : () => handleEditAction(data)}
                            />
                            {isProcessed && renderProcessedBanner(actionId, isProcessed)}
                          </View>
                        );
                      }

                      if (card.type === 'spending_analysis') {
                        return (
                          <View key={cardKey} style={{ marginVertical: spacing.sm }}>
                            <SpendingAnalysisCard
                              periodLabel={data.periodLabel as string}
                              totalSpent={data.totalSpent as number}
                              currency={data.currency as string}
                              breakdown={(data.breakdown as []) || []}
                              topItem={data.topItem as { name: string; amount: number }}
                              trend={data.trend as {
                                previousPeriodLabel: string;
                                previousTotal: number;
                                changeAmount: number;
                                changePercent: number;
                              }}
                              explanation={data.explanation as string}
                              empty={data.empty as boolean}
                              categoryFilterLabel={data.categoryFilterLabel as string}
                            />
                          </View>
                        );
                      }

                      if (card.type === 'affordability') {
                        return (
                          <View key={cardKey} style={{ marginVertical: spacing.sm }}>
                            <AffordabilityCard
                              itemLabel={data.itemLabel as string}
                              amount={data.amount as number}
                              currency={data.currency as string}
                              verdict={data.verdict as 'safe' | 'caution' | 'not_recommended' | 'need_budget_setup'}
                              safeToSpend={data.safeToSpend as number | null}
                              safeToSpendAfter={data.safeToSpendAfter as number | null}
                              categoryName={data.categoryName as string}
                              categoryRemaining={data.categoryRemaining as number}
                              categoryLimit={data.categoryLimit as number}
                              daysLeft={data.daysLeft as number}
                              reason={data.reason as string}
                            />
                          </View>
                        );
                      }

                      if (card.type === 'saving_advice') {
                        return (
                          <View key={cardKey} style={{ marginVertical: spacing.sm }}>
                            <SavingAdviceCard
                              observation={data.observation as string}
                              actions={(data.actions as string[]) || []}
                              empty={data.empty as boolean}
                            />
                          </View>
                        );
                      }

                      if (card.type === 'budget_limit_proposal') {
                        const actionId = data.actionId as string;
                        const isProcessed = processedActions[actionId];
                        return (
                          <View key={cardKey} style={{ marginVertical: spacing.sm }}>
                            <BudgetLimitProposalCard
                              operation={data.operation as 'set' | 'increase' | 'decrease' | 'move'}
                              categoryName={data.categoryName as string}
                              currentLimit={data.currentLimit as number}
                              proposedLimit={data.proposedLimit as number}
                              amount={data.amount as number}
                              currency={data.currency as string}
                              sourceCategoryName={data.sourceCategoryName as string}
                              sourceCurrentLimit={data.sourceCurrentLimit as number}
                              sourceProposedLimit={data.sourceProposedLimit as number}
                              targetCategoryName={data.targetCategoryName as string}
                              targetCurrentLimit={data.targetCurrentLimit as number}
                              targetProposedLimit={data.targetProposedLimit as number}
                              createsNewLimit={data.createsNewLimit as boolean}
                              impactSummary={data.impactSummary as string}
                              onConfirm={isProcessed ? undefined : () => handleConfirmAction(actionId)}
                              onCancel={isProcessed ? undefined : () => handleCancelAction(actionId)}
                              onEdit={isProcessed ? undefined : () => handleEditBudgetLimit(data)}
                            />
                            {isProcessed && renderProcessedBanner(actionId, isProcessed)}
                          </View>
                        );
                      }

                      return null;
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Copilot Status Hub ────────────────────── */}
        <View style={{ marginTop: spacing.xl }}>
          <Card variant="glass" style={styles.hubCard}>
            {/* Safe to Spend Header */}
            <View style={styles.safeSpendRow}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={colors.textMuted}>
                  {t('agent.safeToSpend')}
                </Text>
                {summary && summary.safeToSpend !== null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xxs }}>
                    <Text variant="display" weight="bold" color={colors.primary} style={{ fontSize: 34, lineHeight: 40 }}>
                      {formatCurrency(Math.floor(summary.safeToSpend), summary.monthlyIncome ? undefined : 'ILS')}
                    </Text>
                    <Text variant="bodySmall" color={colors.textMuted} style={{ marginLeft: spacing.xxs }}>
                      {t('common.perDay')}
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: spacing.xs }}>
                    <Text variant="bodySmall" color={colors.textMuted}>
                      Category limits are not configured.
                    </Text>
                    <Pressable onPress={() => router.push('/(tabs)/budget')}>
                      <Text variant="bodySmall" color={colors.primary} weight="bold" style={{ marginTop: spacing.xxs }}>
                        Set category limits to activate Daily Safe-to-Spend
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
              {summary && summary.safeToSpend !== null && (
                <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
                  <ShieldCheck size={14} color={colors.success} />
                  <Text variant="caption" color={colors.success} weight="medium" style={{ marginLeft: 4, fontSize: 11 }}>
                    {t('budget.onTrack')}
                  </Text>
                </View>
              )}
            </View>

            {/* Divider if limits or warnings exist */}
            {summary && summary.categories.filter(c => c.limit > 0).length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderSoft, marginVertical: spacing.md }]} />

                {/* Quick Status Title */}
                <Text variant="caption" weight="bold" color={colors.textMuted} style={{ letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm, fontSize: 11 }}>
                  {t('agent.categoryStatus')}
                </Text>

                {/* Compact Category Grid (2 columns) */}
                <View style={styles.catGrid}>
                  {summary.categories.filter(c => c.limit > 0).slice(0, 4).map((cat) => (
                    <View key={cat.categoryId} style={[styles.catGridItem, { borderColor: colors.borderSoft, borderRadius: radius.md }]}>
                      <View style={styles.catGridHeader}>
                        <Text variant="bodySmall" weight="medium" numberOfLines={1} style={{ fontSize: 13, color: colors.textPrimary, flex: 1 }}>
                          {cat.name}
                        </Text>
                        <Text variant="caption" color={colors.textMuted} style={{ fontSize: 11, marginLeft: spacing.xs }}>
                          {cat.percentage}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={cat.percentage}
                        style={{ marginTop: spacing.xs, height: 4 }}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Warnings Section */}
            {summary && summary.warnings.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderSoft, marginVertical: spacing.md }]} />
                <View style={{ gap: spacing.sm }}>
                  {summary.warnings.map((warn) => {
                    const indicatorColor = 
                      warn.type === 'danger' ? colors.danger :
                      warn.type === 'strong' ? colors.risk :
                      warn.type === 'attention' ? colors.warning :
                      colors.primary;
                    return (
                      <View key={warn.categoryId} style={styles.insightRow}>
                        <View style={[styles.insightIndicator, { backgroundColor: indicatorColor }]} />
                        <Text variant="bodySmall" color={colors.textSecondary} style={{ flex: 1, fontSize: 13 }}>
                          {warn.message}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
        </View>

        {/* ── Dashboard Bottom Manual Actions (Only if no messages) ── */}
        <View style={{ marginTop: spacing.xl }}>
          {messages.length === 0 ? (
            !hasTransactions ? (
              <Card variant="glass" style={styles.emptyCard}>
                <Text variant="h3" align="center" color={colors.primary} style={{ marginBottom: spacing.xs }}>
                  Start with your first transaction
                </Text>
                <Text variant="bodySmall" align="center" color={colors.textMuted} style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.sm }}>
                  Log an expense or income manually to view spending, budget warnings, and daily limits.
                </Text>
                <Button
                  label="Add Transaction"
                  onPress={() => router.push('/transaction/new')}
                />
              </Card>
            ) : (
              <View style={styles.actionContainer}>
                <Button
                  label="Add Manual Transaction"
                  onPress={() => router.push('/transaction/new')}
                  style={{ marginBottom: spacing.md }}
                />
                <Card variant="default" onPress={() => router.push('/(tabs)/activity')} style={{ padding: spacing.md }}>
                  <View style={styles.rowBetween}>
                    <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
                      View Transaction History
                    </Text>
                    <Text variant="caption" color={colors.primary}>
                      {activeTransactions.length} transaction{activeTransactions.length === 1 ? '' : 's'} &rarr;
                    </Text>
                  </View>
                </Card>
              </View>
            )
          ) : (
            <Card variant="default" onPress={() => router.push('/(tabs)/activity')} style={{ padding: spacing.md }}>
              <View style={styles.rowBetween}>
                <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
                  View Transaction History
                </Text>
                <Text variant="caption" color={colors.primary}>
                  {activeTransactions.length} transaction{activeTransactions.length === 1 ? '' : 's'} &rarr;
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* ── Bottom Spacing ───────────────────────── */}
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
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  agentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  greetingSection: {},
  quickActions: {
    gap: 8,
    paddingRight: 20,
  },
  hubCard: {
    padding: 16,
  },
  safeSpendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divider: {
    height: 1,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  catGridItem: {
    width: '48%',
    borderWidth: 1,
    padding: 10,
  },
  catGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  insightIndicator: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  actionContainer: {},
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatSection: {
    width: '100%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatContainer: {
    width: '100%',
  },
  statusBanner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
