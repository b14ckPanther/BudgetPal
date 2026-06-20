/**
 * BudgetPal — Agent Screen (Hero Screen)
 * Agent Command Center: the first and most important screen.
 * Greeting, input bar, quick actions, budget snapshot, insights, warnings, result cards.
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Mic,
  Camera,
  TrendingUp,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, ProgressBar, Button } from '@/components/ui';
import { AgentInputBar, QuickActionChip, AgentMessageBubble, VoiceRecordingBar } from '@/components/agent';
import { TransactionPreviewCard } from '@/components/cards/TransactionPreviewCard';
import { VoicePreviewCard } from '@/components/cards/VoicePreviewCard';
import { SpendingAnalysisCard } from '@/components/cards/SpendingAnalysisCard';
import { AffordabilityCard } from '@/components/cards/AffordabilityCard';
import { SavingAdviceCard } from '@/components/cards/SavingAdviceCard';
import { BudgetLimitProposalCard } from '@/components/cards/BudgetLimitProposalCard';
import { t } from '@/lib/i18n';
import { useCurrentProfile, useBudgetSummary, useTransactions } from '@/hooks/useBudgetQueries';
import { useAgentChatScroll } from '@/hooks/useAgentChatScroll';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { formatCurrency } from '@/lib/currency';
import { formatCategoryLabel } from '@/lib/categoryHierarchy';
import { supabase } from '@/lib/supabase';
import { getAgentMessages, sendMessageToAgent, confirmAgentAction, cancelAgentAction, clearAgentHistory } from '@/services/agent';
import { transcribeVoiceAudio } from '@/services/voice';
import { useVoiceRecorder, VoiceRecordingResult } from '@/hooks/useVoiceRecorder';
import { useAgentSpeech } from '@/hooks/useAgentSpeech';
import { hapticPreviewReady, hapticVoiceError } from '@/lib/voiceFeedback';
import { buildAgentSpeakableSummary } from '@/lib/agentSpeakableSummary';
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
  const transcribingRef = useRef(false);
  const transcribeRecordingRef = useRef<(recording: VoiceRecordingResult) => void>(() => {});
  const autoplayedMessageIdsRef = useRef(new Set<string>());
  const pendingAutoplayRef = useRef<{ messageId: string; summary: string } | null>(null);

  const voiceRepliesEnabled = profile?.agentVoiceRepliesEnabled === true;

  const voiceRecorder = useVoiceRecorder({
    onAutoStop: (result) => {
      transcribeRecordingRef.current(result);
    },
  });

  const isVoiceBusy =
    voiceRecorder.uiState === 'listening' ||
    voiceRecorder.uiState === 'auto_stopping' ||
    voiceRecorder.uiState === 'transcribing';

  const { speakingMessageId, speakSummary, stopSpeaking } = useAgentSpeech({
    enabled: voiceRepliesEnabled,
    language: profile?.preferredLanguage === 'en' ? 'en-US' : profile?.preferredLanguage || 'en-US',
    profileCurrency: profile?.currency || 'ILS',
    isVoiceCaptureActive: isVoiceBusy,
  });

  const resolveSpokenSummary = useCallback(
    (message: Pick<AgentMessage, 'intent' | 'content' | 'cards'>, outcome?: 'confirmed' | 'cancelled' | 'error') =>
      buildAgentSpeakableSummary({
        intent: message.intent,
        message: message.content,
        cards: message.cards,
        firstName: profile?.firstName,
        currency: profile?.currency,
        outcome,
      }),
    [profile?.firstName, profile?.currency]
  );

  const queueAgentAutoplay = useCallback(
    (messageId: string, summary: string | null) => {
      if (!voiceRepliesEnabled || !summary?.trim()) return;
      if (autoplayedMessageIdsRef.current.has(messageId)) return;

      if (isVoiceBusy) {
        pendingAutoplayRef.current = { messageId, summary };
        return;
      }

      autoplayedMessageIdsRef.current.add(messageId);
      void speakSummary(messageId, summary);
    },
    [voiceRepliesEnabled, isVoiceBusy, speakSummary]
  );

  useEffect(() => {
    const pending = pendingAutoplayRef.current;
    if (!pending || !voiceRepliesEnabled || isVoiceBusy) return;
    if (autoplayedMessageIdsRef.current.has(pending.messageId)) {
      pendingAutoplayRef.current = null;
      return;
    }

    pendingAutoplayRef.current = null;
    autoplayedMessageIdsRef.current.add(pending.messageId);
    void speakSummary(pending.messageId, pending.summary);
  }, [isVoiceBusy, voiceRepliesEnabled, speakSummary]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeaking();
      };
    }, [stopSpeaking])
  );

  // Load message history and action statuses when screen is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHistory() {
        try {
          const history = await getAgentMessages();
          if (!active) return;
          setMessages(history);

          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !active) return;

          const { data: actions } = await supabase
            .from('agent_actions')
            .select('id, status')
            .eq('user_id', user.id)
            .in('status', ['executed', 'cancelled']);

          if (actions && active) {
            const map: Record<string, 'confirmed' | 'cancelled'> = {};
            actions.forEach((a) => {
              map[a.id] = a.status === 'executed' ? 'confirmed' : 'cancelled';
            });
            setProcessedActions(map);
          }
        } catch (err) {
          console.error('Failed to load message history:', err);
        }
      }

      loadHistory();
      return () => {
        active = false;
      };
    }, [])
  );

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

  const [composerHeight, setComposerHeight] = useState(200);
  const keyboardInset = useKeyboardInset();
  const {
    listRef,
    showJumpToLatest,
    handleScroll,
    onContentSizeChange,
    notifyNewContent,
    stickToLatest,
    prepareForOutgoingMessage,
  } = useAgentChatScroll(messages.length);

  useEffect(() => {
    notifyNewContent();
  }, [messages, isSending, processedActions, voiceRecorder.uiState, notifyNewContent]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    prepareForOutgoingMessage();
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

      const agentMsgId = `agent-${Date.now()}`;
      const agentPayload = {
        intent: response.intent,
        content: response.message,
        cards: response.cards,
      };
      const spokenSummary = resolveSpokenSummary(agentPayload) ?? undefined;

      const agentMsg: AgentMessage = {
        id: agentMsgId,
        role: 'agent',
        content: response.message,
        intent: response.intent,
        confidence: response.confidence,
        cards: response.cards,
        suggestedPrompts: response.suggestedPrompts,
        spokenSummary,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, agentMsg]);
      queueAgentAutoplay(agentMsgId, spokenSummary ?? null);
    } catch (err: any) {
      console.error('Failed to send message to agent:', err);
      Alert.alert(t('agent.sendError') || 'Error', err.message || 'Could not communicate with the agent.');
      
      // Add error system/agent message
      const errorMsgId = `error-${Date.now()}`;
      const spokenSummary = resolveSpokenSummary(
        { content: "Sorry, I encountered an error. Please try again." },
        'error'
      );
      const errorMsg: AgentMessage = {
        id: errorMsgId,
        role: 'agent',
        content: "Sorry, I encountered an error. Please try again.",
        spokenSummary: spokenSummary ?? undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
      queueAgentAutoplay(errorMsgId, spokenSummary);
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

      if (voiceRepliesEnabled) {
        const spoken = resolveSpokenSummary({ content: '' }, 'confirmed');
        if (spoken) {
          queueAgentAutoplay(`confirm-${actionId}`, spoken);
        }
      }

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

      if (voiceRepliesEnabled) {
        const spoken = resolveSpokenSummary({ content: '' }, 'cancelled');
        if (spoken) {
          queueAgentAutoplay(`cancel-${actionId}`, spoken);
        }
      }
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

  const handleEditVoiceAction = (proposal: Record<string, unknown>) => {
    router.push({
      pathname: '/transaction/agent-edit',
      params: {
        actionId: proposal.actionId as string,
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

  const appendAgentResponse = useCallback((userContent: string, response: {
    message: string;
    intent?: string;
    confidence?: number;
    cards?: AgentMessage['cards'];
    suggestedPrompts?: string[];
  }) => {
    const agentMsgId = `agent-${Date.now()}`;
    const agentPayload = {
      intent: response.intent as AgentMessage['intent'],
      content: response.message,
      cards: response.cards,
    };
    const spokenSummary = resolveSpokenSummary(agentPayload) ?? undefined;

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    const agentMsg: AgentMessage = {
      id: agentMsgId,
      role: 'agent',
      content: response.message,
      intent: response.intent as AgentMessage['intent'],
      confidence: response.confidence,
      cards: response.cards,
      suggestedPrompts: response.suggestedPrompts,
      spokenSummary,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);

    queueAgentAutoplay(agentMsgId, spokenSummary ?? null);

    return { agentMsgId, spokenSummary: spokenSummary ?? null };
  }, [resolveSpokenSummary, queueAgentAutoplay]);

  const transcribeRecording = useCallback(async (recording: VoiceRecordingResult) => {
    if (transcribingRef.current) return;
    if (!recording.speechDetected) {
      voiceRecorder.setFailed(t('voice.noSpeech'));
      return;
    }

    transcribingRef.current = true;
    voiceRecorder.markTranscribing();

    try {
      const response = await transcribeVoiceAudio(
        recording.uri,
        recording.durationMs,
        recording.mimeType,
        recording.speechDetected
      );

      const transcription = response.transcription || response.message;
      appendAgentResponse(
        transcription ? `"${transcription}"` : t('voice.listening'),
        response
      );

      const hasVoicePreview = (response.cards || []).some((c) => c.type === 'voice_preview');
      if (hasVoicePreview) {
        await hapticPreviewReady();
      }

      voiceRecorder.markPreviewReady();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('voice.transcribeFailed');
      await hapticVoiceError();
      voiceRecorder.setFailed(message);
    } finally {
      transcribingRef.current = false;
    }
  }, [appendAgentResponse, voiceRecorder]);

  transcribeRecordingRef.current = (recording) => {
    void transcribeRecording(recording);
  };

  const handleMicPress = async () => {
    if (isSending || isVoiceBusy) {
      return;
    }
    prepareForOutgoingMessage();
    stopSpeaking();
    await voiceRecorder.startRecording();
  };

  const handleVoiceStop = async () => {
    stopSpeaking();
    const recording = await voiceRecorder.stopRecording();
    if (!recording) return;
    await transcribeRecording(recording);
  };

  const handleVoiceCancel = async () => {
    stopSpeaking();
    await voiceRecorder.cancelRecording();
  };

  const handleVoiceRetry = async () => {
    stopSpeaking();
    voiceRecorder.reset();
    await voiceRecorder.startRecording();
  };

  const handleDismissNoSpeech = () => {
    voiceRecorder.reset();
  };

  const handleClearChat = () => {
    Alert.alert(
      t('agent.clearHistoryTitle'),
      t('agent.clearHistoryMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('agent.clearHistoryConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAgentHistory();
              setMessages([]);
              setProcessedActions({});
              prepareForOutgoingMessage();
              queryClient.invalidateQueries();
            } catch {
              Alert.alert(t('agent.clearHistoryTitle'), t('agent.clearHistoryError'));
            }
          },
        },
      ]
    );
  };

  // Handle Quick Action Clicks
  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'voiceExpense') {
      handleMicPress();
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

  const renderMessageCards = useCallback(
    (msg: AgentMessage) =>
      msg.cards?.map((card, cardIdx) => {
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

        if (card.type === 'voice_preview') {
          const actionId = data.actionId as string;
          const isProcessed = processedActions[actionId];
          return (
            <View key={cardKey} style={{ marginVertical: spacing.sm }}>
              <VoicePreviewCard
                transcription={data.transcription as string}
                merchant={data.merchant as string}
                title={data.title as string}
                amount={data.amount as number}
                category={formatCategoryLabel(
                  data.categoryName as string,
                  data.subcategoryName as string
                )}
                date={data.date as string}
                type={(data.type as 'expense' | 'income' | 'transfer') || 'expense'}
                interpretationConfidence={
                  (data.interpretationConfidence as number) ?? (data.confidence as number)
                }
                onConfirm={isProcessed ? undefined : () => handleConfirmAction(actionId)}
                onCancel={isProcessed ? undefined : () => handleCancelAction(actionId)}
                onEdit={isProcessed ? undefined : () => handleEditVoiceAction(data)}
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
      }),
    [
      processedActions,
      spacing.sm,
      handleConfirmAction,
      handleCancelAction,
      handleEditAction,
      handleEditVoiceAction,
      handleEditBudgetLimit,
      renderProcessedBanner,
    ]
  );

  const renderMessageItem = useCallback(
    ({ item, index }: { item: AgentMessage; index: number }) => {
      const isLast = index === messages.length - 1;
      return (
        <View>
          <AgentMessageBubble
            message={item}
            isLastMessage={isLast && !isSending}
            voiceRepliesEnabled={voiceRepliesEnabled}
            spokenSummary={item.spokenSummary ?? resolveSpokenSummary(item)}
            isSpeaking={speakingMessageId === item.id}
            onSpeakPress={() => {
              const text = item.spokenSummary ?? resolveSpokenSummary(item);
              if (text) void speakSummary(item.id, text);
            }}
            onStopSpeakingPress={stopSpeaking}
            onPromptPress={(prompt) => {
              setInputValue(prompt);
            }}
          />
          {renderMessageCards(item)}
        </View>
      );
    },
    [
      messages.length,
      isSending,
      voiceRepliesEnabled,
      speakingMessageId,
      resolveSpokenSummary,
      speakSummary,
      stopSpeaking,
      renderMessageCards,
    ]
  );

  const renderHubCard = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <Card variant="glass" style={styles.hubCard}>
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
                  {t('agent.categoryLimitsNotConfigured')}
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/budget')}>
                  <Text variant="bodySmall" color={colors.primary} weight="bold" style={{ marginTop: spacing.xxs }}>
                    {t('agent.setCategoryLimitsCta')}
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

        {summary && summary.categories.filter((c) => c.limit > 0).length > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.borderSoft, marginVertical: spacing.md }]} />
            <Text variant="caption" weight="bold" color={colors.textMuted} style={{ letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm, fontSize: 11 }}>
              {t('agent.categoryStatus')}
            </Text>
            <View style={styles.catGrid}>
              {summary.categories.filter((c) => c.limit > 0).slice(0, 4).map((cat) => (
                <View key={cat.categoryId} style={[styles.catGridItem, { borderColor: colors.borderSoft, borderRadius: radius.md }]}>
                  <View style={styles.catGridHeader}>
                    <Text variant="bodySmall" weight="medium" numberOfLines={1} style={{ fontSize: 13, color: colors.textPrimary, flex: 1 }}>
                      {cat.name}
                    </Text>
                    <Text variant="caption" color={colors.textMuted} style={{ fontSize: 11, marginLeft: spacing.xs }}>
                      {cat.percentage}%
                    </Text>
                  </View>
                  <ProgressBar progress={cat.percentage} style={{ marginTop: spacing.xs, height: 4 }} />
                </View>
              ))}
            </View>
          </>
        )}

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
  );

  const renderListHeader = useCallback(() => (
    <View>
      {renderHubCard()}
      {messages.length === 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          {!hasTransactions ? (
            <Card variant="glass" style={styles.emptyCard}>
              <Text variant="h3" align="center" color={colors.primary} style={{ marginBottom: spacing.xs }}>
                {t('agent.startFirstTransactionTitle')}
              </Text>
              <Text variant="bodySmall" align="center" color={colors.textMuted} style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.sm }}>
                {t('agent.startFirstTransactionBody')}
              </Text>
              <Button
                label={t('agent.addTransaction')}
                onPress={() => router.push('/transaction/new')}
              />
            </Card>
          ) : (
            <View style={styles.actionContainer}>
              <Button
                label={t('agent.addManualTransaction')}
                onPress={() => router.push('/transaction/new')}
                style={{ marginBottom: spacing.md }}
              />
            </View>
          )}
        </View>
      )}
      {messages.length > 0 && (
        <View style={[styles.chatHeader, { marginBottom: spacing.md }]}>
          <Text variant="caption" weight="bold" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>
            {t('agent.conversation').toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  ), [messages.length, hasTransactions, colors, spacing, radius, summary, router]);

  const renderListFooter = useCallback(() => (
    <View>
      {isSending && (
        <View style={[styles.thinkingRow, { marginTop: spacing.sm, marginBottom: spacing.md }]}>
          <View style={[styles.thinkingBubble, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSoft, borderRadius: radius.lg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text variant="bodySmall" color={colors.textMuted} style={{ marginLeft: spacing.sm }}>
              {t('agent.agentThinking')}
            </Text>
          </View>
        </View>
      )}
      {messages.length > 0 && (
        <Card variant="default" onPress={() => router.push('/(tabs)/activity')} style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.rowBetween}>
            <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
              {t('agent.viewTransactionHistory')}
            </Text>
            <Text variant="caption" color={colors.primary}>
              {activeTransactions.length} transaction{activeTransactions.length === 1 ? '' : 's'} &rarr;
            </Text>
          </View>
        </Card>
      )}
    </View>
  ), [isSending, messages.length, colors, spacing, radius, activeTransactions.length, router]);

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
    <Screen backgroundVariant="hero" style={styles.screen}>
      <View style={[styles.flex, { paddingBottom: keyboardInset }]}>
        <View style={[styles.topHeader, { paddingHorizontal: spacing.xl }]}>
          <View style={styles.brandRow}>
            <Text variant="caption" weight="bold" color={colors.textPrimary} style={{ letterSpacing: 2, opacity: 0.8 }}>
              BUDGETPAL
            </Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleClearChat}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('agent.clearHistory')}
                style={({ pressed }) => [
                  styles.clearHistoryButton,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.borderSoft,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Trash2 size={14} color={colors.textSecondary} />
                <Text variant="caption" color={colors.textSecondary} weight="medium" style={{ marginLeft: spacing.xxs }}>
                  {t('agent.clearHistory')}
                </Text>
              </Pressable>
              <View style={[styles.agentStatusBadge, { backgroundColor: colors.primarySoft }]}>
                <View style={[styles.pulsingDot, { backgroundColor: colors.primary }]} />
                <Text variant="caption" weight="medium" color={colors.primary} style={{ fontSize: 11 }}>
                  {t('common.agentActive')}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.greetingSection, { marginTop: spacing.sm }]}>
            <Text variant="h1" style={{ fontSize: 28, lineHeight: 34 }}>
              {greeting}, {displayName}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.xxs, opacity: 0.9 }}>
              {t('agent.prompt')}
            </Text>
          </View>
        </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: composerHeight + spacing.lg + keyboardInset,
              flexGrow: 1,
            }}
            style={styles.flex}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onContentSizeChange}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
            }
          />

          {showJumpToLatest && (
            <Pressable
              onPress={stickToLatest}
              accessibilityRole="button"
              accessibilityLabel={t('agent.jumpToLatest')}
              style={[
                styles.jumpToLatest,
                {
                  bottom: composerHeight + spacing.sm + keyboardInset,
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.borderSoft,
                  borderRadius: radius.full,
                },
              ]}
            >
              <ChevronDown size={16} color={colors.primary} />
              <Text variant="caption" color={colors.primary} weight="medium" style={{ marginLeft: spacing.xxs }}>
                {t('agent.jumpToLatest')}
              </Text>
            </Pressable>
          )}

          <View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && Math.abs(nextHeight - composerHeight) > 2) {
                setComposerHeight(nextHeight);
              }
            }}
            style={[
              styles.composerDock,
              {
                borderTopColor: colors.borderSoft,
                backgroundColor: colors.surfaceGlass,
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
              },
            ]}
          >
            <VoiceRecordingBar
              state={voiceRecorder.uiState}
              elapsedMs={voiceRecorder.elapsedMs}
              meterLevel={voiceRecorder.meterLevel}
              silenceDetectionEnabled={voiceRecorder.silenceDetectionEnabled}
              errorMessage={voiceRecorder.errorMessage}
              onStop={handleVoiceStop}
              onCancel={handleVoiceCancel}
              onRetry={handleVoiceRetry}
              onDismissNoSpeech={handleDismissNoSpeech}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.quickActions, { marginTop: spacing.sm, marginBottom: spacing.sm }]}
              keyboardShouldPersistTaps="handled"
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
            <AgentInputBar
              value={inputValue}
              onChangeText={setInputValue}
              onSend={handleSend}
              onMicPress={handleMicPress}
              onCameraPress={() => handleQuickAction('scanReceipt')}
              loading={isSending}
              voiceActive={voiceRecorder.uiState === 'listening'}
              disabled={
                isVoiceBusy ||
                voiceRecorder.uiState === 'failed' ||
                voiceRecorder.uiState === 'no_speech'
              }
            />
          </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  composerDock: {
    borderTopWidth: 1,
  },
  jumpToLatest: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  thinkingRow: {
    alignItems: 'flex-start',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
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
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBanner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
