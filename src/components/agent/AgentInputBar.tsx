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
          style={styles.actionBtn} 
          hitSlop={8}
          disabled={isInteractionDisabled}
        >
          <Paperclip size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable 
          onPress={isInteractionDisabled ? undefined : onCameraPress} 
          style={styles.actionBtn} 
          hitSlop={8}
          disabled={isInteractionDisabled}
        >
          <Camera size={20} color={colors.textMuted} />
        </Pressable>
        {loading ? (
          <View style={styles.actionBtn}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Pressable
            onPress={isInteractionDisabled ? undefined : onMicPress}
            style={[
              styles.actionBtn,
              voiceActive && { backgroundColor: colors.primarySoft, borderRadius: 14 },
            ]}
            hitSlop={8}
            disabled={isInteractionDisabled}
          >
            <Mic size={20} color={voiceActive ? colors.primary : colors.primary} />
          </Pressable>
        )}
        {text.trim().length > 0 && !loading && (
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
            disabled={isInteractionDisabled}
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
    gap: 6,
  },
  actionBtn: {
    padding: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
