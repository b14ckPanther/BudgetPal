/**
 * BudgetPal — AgentMessageBubble Component
 * Styled message bubbles for the agent conversation screen, supporting suggested prompts.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Volume2, Square } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';
import { AgentMessage } from '@/types/agent';
import { t } from '@/lib/i18n';

interface AgentMessageBubbleProps {
  message: AgentMessage;
  onPromptPress?: (prompt: string) => void;
  isLastMessage?: boolean;
  voiceRepliesEnabled?: boolean;
  spokenSummary?: string | null;
  isSpeaking?: boolean;
  onSpeakPress?: () => void;
  onStopSpeakingPress?: () => void;
}

export function AgentMessageBubble({
  message,
  onPromptPress,
  isLastMessage = false,
  voiceRepliesEnabled = false,
  spokenSummary,
  isSpeaking = false,
  onSpeakPress,
  onStopSpeakingPress,
}: AgentMessageBubbleProps) {
  const { colors, radius, spacing } = useTheme();
  const isUser = message.role === 'user';
  const canReplay = !isUser && voiceRepliesEnabled && !!spokenSummary?.trim();

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      <View style={styles.bubbleRow}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary, borderRadius: radius.lg }]
              : [styles.agentBubble, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSoft, borderRadius: radius.lg }],
          ]}
        >
          <Text
            variant="body"
            color={isUser ? colors.textInverse : colors.textPrimary}
            style={styles.text}
          >
            {message.content}
          </Text>
        </View>

        {canReplay && (
          <Pressable
            onPress={isSpeaking ? onStopSpeakingPress : onSpeakPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              isSpeaking ? t('agentSpeech.stopSpeaking') : t('agentSpeech.replay')
            }
            style={({ pressed }) => [
              styles.speechButton,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.borderSoft,
                borderRadius: radius.md,
                marginLeft: spacing.xs,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            {isSpeaking ? (
              <Square size={14} color={colors.primary} fill={colors.primary} />
            ) : (
              <Volume2 size={16} color={colors.primary} />
            )}
          </Pressable>
        )}
      </View>

      {!isUser && isLastMessage && message.suggestedPrompts && message.suggestedPrompts.length > 0 && (
        <View style={[styles.promptsContainer, { marginTop: spacing.sm }]}>
          {message.suggestedPrompts.map((prompt, idx) => (
            <Pressable
              key={`${message.id}-prompt-${idx}`}
              onPress={() => onPromptPress && onPromptPress(prompt)}
              style={({ pressed }) => [
                styles.promptChip,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                  borderRadius: radius.md,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text variant="caption" color={colors.primary} weight="medium">
                {prompt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  agentContainer: {
    alignItems: 'flex-start',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '92%',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  speechButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  agentBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  text: {
    lineHeight: 20,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: '90%',
  },
  promptChip: {
    borderWidth: 1,
  },
});
