/**
 * On-device agent text-to-speech via expo-speech.
 * No server calls, no audio file storage.
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { normalizeAgentSpeechText } from '@/lib/speechText';
import { restorePlaybackAudioMode } from '@/lib/voiceAudioSession';
import {
  AgentSpeechPreferences,
  getSpeechRate,
  resolveSpeechVoice,
} from './speechPreferences';

export type { AgentSpeechPreferences, ResolvedSpeechVoice } from './speechPreferences';
export { getCachedSpeechVoice, resetSpeechVoiceCache } from './speechPreferences';

let activeMessageId: string | null = null;
let onSpeakingChange: ((messageId: string | null) => void) | null = null;

export function setAgentSpeechListener(listener: ((messageId: string | null) => void) | null) {
  onSpeakingChange = listener;
}

function notifySpeaking(messageId: string | null) {
  activeMessageId = messageId;
  onSpeakingChange?.(messageId);
}

export function getSpeakingMessageId(): string | null {
  return activeMessageId;
}

export async function isAgentSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return activeMessageId !== null;
  }
}

export function stopAgentSpeech(): void {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
  notifySpeaking(null);
}

export async function speakAgentText(
  text: string,
  options: {
    messageId: string;
    preferences?: AgentSpeechPreferences;
  }
): Promise<void> {
  const preferences = options.preferences ?? {};
  const speechLocale = preferences.language?.toLowerCase().startsWith('he') ? 'he' : 'en';
  const normalized = normalizeAgentSpeechText(
    text,
    preferences.profileCurrency || 'ILS',
    speechLocale
  );
  if (!normalized.trim()) return;

  stopAgentSpeech();

  try {
    await restorePlaybackAudioMode();
  } catch (err) {
    console.warn('Failed to restore playback audio mode before TTS:', err);
  }

  const voice = await resolveSpeechVoice(preferences);
  const language = voice.language || preferences.language || 'en-US';
  const rate = getSpeechRate(preferences);

  if (__DEV__) {
    console.log('[AgentSpeech] voice', {
      name: voice.name,
      language: voice.language,
      quality: voice.quality,
      source: voice.source,
      identifier: voice.identifier,
    });
  }

  notifySpeaking(options.messageId);

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (activeMessageId === options.messageId) {
        notifySpeaking(null);
      }
      resolve();
    };

    Speech.speak(normalized, {
      language,
      voice: voice.identifier,
      rate,
      pitch: 1.0,
      volume: 1.0,
      ...(Platform.OS === 'ios' ? { useApplicationAudioSession: false } : {}),
      onDone: finish,
      onStopped: finish,
      onError: finish,
    });
  });
}
