/**
 * BudgetPal — AgentInputBar Component
 * Main input bar with text field, mic, scan, and upload action icons.
 */

import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Mic, Camera, Paperclip, Send } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';

interface AgentInputBarProps {
  onSend?: (text: string) => void;
  onMicPress?: () => void;
  onCameraPress?: () => void;
  onAttachPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  voiceActive?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

const ICON_HIT = { minWidth: 44, minHeight: 44, alignItems: 'center' as const, justifyContent: 'center' as const };

export function AgentInputBar({
  onSend,
  onMicPress,
  onCameraPress,
  onAttachPress,
  loading = false,
  disabled = false,
  voiceActive = false,
  value,
  onChangeText,
}: AgentInputBarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [localText, setLocalText] = useState('');

  const isControlled = value !== undefined;
  const text = isControlled ? value : localText;
  const setText = isControlled && onChangeText ? onChangeText : setLocalText;

  const handleSend = () => {
    if (disabled || loading) return;
    if (text.trim() && onSend) {
      onSend(text.trim());
      if (!isControlled) {
        setLocalText('');
      }
    }
  };

  const isInteractionDisabled = disabled || loading || voiceActive;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          opacity: isInteractionDisabled ? 0.7 : 1,
        },
      ]}
      accessibilityRole="none"
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('agent.inputPlaceholder')}
        placeholderTextColor={colors.textMuted}
        editable={!isInteractionDisabled}
        multiline
        scrollEnabled
        blurOnSubmit={false}
        textAlignVertical="center"
        accessibilityLabel={t('agent.inputPlaceholder')}
        accessibilityHint={t('agent.inputPlaceholder')}
        style={[
          styles.input,
          {
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.md,
            color: colors.textPrimary,
            maxHeight: 120,
          },
        ]}
        returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
        onSubmitEditing={Platform.OS === 'android' ? handleSend : undefined}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={isInteractionDisabled ? undefined : onAttachPress}
          style={ICON_HIT}
          hitSlop={4}
          disabled={isInteractionDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('receipt.chooseLibrary')}
        >
          <Paperclip size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={isInteractionDisabled ? undefined : onCameraPress}
          style={ICON_HIT}
          hitSlop={4}
          disabled={isInteractionDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('receipt.scanTitle')}
          accessibilityHint={t('agent.quickActions.scanReceipt')}
        >
          <Camera size={20} color={colors.textMuted} />
        </Pressable>
        {loading ? (
          <View style={ICON_HIT} accessibilityLabel={t('agent.agentThinking')}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Pressable
            onPress={isInteractionDisabled ? undefined : onMicPress}
            style={[
              ICON_HIT,
              voiceActive && { backgroundColor: colors.primarySoft, borderRadius: 22 },
            ]}
            hitSlop={4}
            disabled={isInteractionDisabled}
            accessibilityRole="button"
            accessibilityLabel={t('agent.quickActions.voiceExpense')}
            accessibilityState={{ selected: voiceActive }}
          >
            <Mic size={20} color={voiceActive ? colors.primary : colors.primary} />
          </Pressable>
        )}
        {text.trim().length > 0 && !loading && (
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            hitSlop={4}
            disabled={isInteractionDisabled}
            accessibilityRole="button"
            accessibilityLabel={t('agent.sendMessage')}
          >
            <Send size={16} color={colors.textInverse} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 36,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
