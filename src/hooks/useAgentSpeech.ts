/**
 * Agent voice reply playback — device TTS with recording-safe guards.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AgentSpeechPreferences,
  getSpeakingMessageId,
  setAgentSpeechListener,
  speakAgentText,
  stopAgentSpeech,
} from '@/services/agentSpeech';

export interface UseAgentSpeechOptions {
  enabled: boolean;
  language?: string;
  profileCurrency?: string;
  isVoiceCaptureActive: boolean;
}

export function useAgentSpeech({
  enabled,
  language,
  profileCurrency,
  isVoiceCaptureActive,
}: UseAgentSpeechOptions) {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    () => getSpeakingMessageId()
  );
  const enabledRef = useRef(enabled);
  const captureActiveRef = useRef(isVoiceCaptureActive);
  const preferencesRef = useRef<AgentSpeechPreferences>({
    language: language || 'en-US',
    profileCurrency: profileCurrency || 'ILS',
  });

  enabledRef.current = enabled;
  captureActiveRef.current = isVoiceCaptureActive;
  preferencesRef.current = {
    language: language || 'en-US',
    profileCurrency: profileCurrency || 'ILS',
  };

  useEffect(() => {
    setAgentSpeechListener(setSpeakingMessageId);
    return () => {
      setAgentSpeechListener(null);
      stopAgentSpeech();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopAgentSpeech();
    }
  }, [enabled]);

  useEffect(() => {
    if (isVoiceCaptureActive) {
      stopAgentSpeech();
    }
  }, [isVoiceCaptureActive]);

  const stopSpeaking = useCallback(() => {
    stopAgentSpeech();
  }, []);

  const speakSummary = useCallback(async (messageId: string, text: string) => {
    if (!enabledRef.current) return;
    if (captureActiveRef.current) return;

    await speakAgentText(text, {
      messageId,
      preferences: preferencesRef.current,
    });
  }, []);

  return {
    speakingMessageId,
    isSpeaking: speakingMessageId !== null,
    speakSummary,
    stopSpeaking,
  };
}
