/**
 * BudgetPal — VoiceRecordingBar
 * Recording state UI with live level visualization.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Mic, Square, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import type { VoiceRecorderState } from '@/hooks/useVoiceRecorder';

interface VoiceRecordingBarProps {
  state: VoiceRecorderState;
  elapsedMs?: number;
  meterLevel?: number;
  silenceDetectionEnabled?: boolean;
  errorMessage?: string | null;
  onStop?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismissNoSpeech?: () => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function VoiceLevelBars({ level, active }: { level: number; active: boolean }) {
  const { colors } = useTheme();
  const heights = useMemo(() => [0.35, 0.55, 0.75, 0.55, 0.35], []);

  return (
    <View style={styles.levelBars}>
      {heights.map((weight, index) => {
        const barLevel = active ? Math.min(1, level * (1.1 + index * 0.08)) * weight : 0.12 * weight;
        return (
          <View
            key={`bar-${index}`}
            style={[
              styles.levelBar,
              {
                height: 6 + barLevel * 18,
                backgroundColor: active ? colors.primary : colors.border,
                opacity: active ? 0.45 + barLevel * 0.55 : 0.35,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function MicGlow({ level, active, failed }: { level: number; active: boolean; failed: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const targetScale = active ? 1 + level * 0.22 : 1;
    const targetOpacity = active ? 0.28 + level * 0.45 : failed ? 0.2 : 0.18;
    scale.value = withSpring(targetScale, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(targetOpacity, { duration: 120 });
  }, [active, failed, level, opacity, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.micGlow,
        glowStyle,
        { backgroundColor: failed ? colors.danger : colors.ai },
      ]}
    />
  );
}

export function VoiceRecordingBar({
  state,
  elapsedMs = 0,
  meterLevel = 0,
  silenceDetectionEnabled = true,
  errorMessage,
  onStop,
  onCancel,
  onRetry,
  onDismissNoSpeech,
}: VoiceRecordingBarProps) {
  const { colors, spacing, radius } = useTheme();

  if (state === 'idle') return null;

  const isListening = state === 'listening';
  const isAutoStopping = state === 'auto_stopping';
  const isTranscribing = state === 'transcribing';
  const isNoSpeech = state === 'no_speech';
  const isFailed = state === 'failed';
  const isCancelled = state === 'cancelled';
  const showControls = isListening;
  const showLevel = isListening || isAutoStopping;
  const activeLevel = isListening;

  const borderColor = isFailed || isNoSpeech
    ? colors.danger
    : isCancelled
      ? colors.border
      : colors.primary;

  const statusText = isListening
    ? t('voice.listening')
    : isAutoStopping
      ? t('voice.autoStopping')
      : isTranscribing
        ? t('voice.transcribing')
        : isNoSpeech
          ? t('voice.noSpeechTitle')
          : isCancelled
            ? t('voice.cancelled')
            : t('voice.failed');

  const subtitle = isListening
    ? silenceDetectionEnabled
      ? `${formatElapsed(elapsedMs)} · ${t('voice.listeningHintAuto')}`
      : `${formatElapsed(elapsedMs)} · ${t('voice.listeningHintManual')}`
    : isTranscribing
      ? t('voice.transcribingHint')
      : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconArea}>
          <MicGlow level={meterLevel} active={showLevel} failed={isFailed || isNoSpeech} />
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isFailed || isNoSpeech ? colors.dangerSoft : colors.primarySoft,
              },
            ]}
          >
            {isTranscribing || isAutoStopping ? (
              <ActivityIndicator size="small" color={colors.ai} />
            ) : (
              <Mic size={18} color={isFailed || isNoSpeech ? colors.danger : colors.primary} />
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
            {statusText}
          </Text>
          {subtitle && (
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
          {(isFailed || isNoSpeech) && errorMessage && (
            <Text variant="caption" color={colors.danger} style={{ marginTop: 2 }}>
              {errorMessage}
            </Text>
          )}
          {showLevel && <VoiceLevelBars level={meterLevel} active={activeLevel} />}
        </View>

        {showControls && (
          <View style={styles.actions}>
            <Pressable onPress={onCancel} hitSlop={8} style={styles.actionBtn}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={onStop}
              hitSlop={8}
              style={[styles.stopBtn, { backgroundColor: colors.primary }]}
            >
              <Square size={14} color={colors.textInverse} fill={colors.textInverse} />
            </Pressable>
          </View>
        )}

        {(isFailed || isNoSpeech) && onRetry && (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text variant="caption" weight="bold" color={colors.primary}>
              {t('voice.tryAgain')}
            </Text>
          </Pressable>
        )}

        {isNoSpeech && onDismissNoSpeech && (
          <Pressable onPress={onDismissNoSpeech} hitSlop={8} style={{ marginLeft: 8 }}>
            <Text variant="caption" color={colors.textMuted}>
              {t('common.close')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconArea: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 8,
    height: 22,
  },
  levelBar: {
    width: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  stopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
