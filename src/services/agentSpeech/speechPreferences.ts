/**
 * Session voice selection and future Profile speech preferences.
 */

import * as Speech from 'expo-speech';
import { Voice, VoiceQuality } from 'expo-speech';

export interface AgentSpeechPreferences {
  /** BCP-47 language, e.g. en-US */
  language?: string;
  /** Device voice identifier from Speech.getAvailableVoicesAsync() */
  voiceIdentifier?: string;
  /** Speech rate multiplier (platform-specific; ~0.92–0.96 is natural on iOS) */
  rate?: number;
  /** Profile default currency for money normalization */
  profileCurrency?: string;
}

export interface ResolvedSpeechVoice {
  identifier?: string;
  language: string;
  name?: string;
  quality?: VoiceQuality | string;
  source: 'preference' | 'enhanced' | 'english' | 'default';
}

const ENGLISH_LOCALE_PRIORITY = ['en-US', 'en-GB', 'en-AU', 'en-IE', 'en-CA', 'en-IN', 'en'];

const DEFAULT_SPEECH_RATE = 0.94;
const DEFAULT_SPEECH_LANGUAGE = 'en-US';

let cachedVoice: ResolvedSpeechVoice | null = null;
let voiceResolutionPromise: Promise<ResolvedSpeechVoice> | null = null;

function scoreVoice(voice: Voice): number {
  const language = (voice.language || '').toLowerCase();
  let score = 0;

  const localeIndex = ENGLISH_LOCALE_PRIORITY.findIndex((locale) =>
    language === locale.toLowerCase() || language.startsWith(`${locale.toLowerCase()}-`)
  );
  if (localeIndex >= 0) {
    score += 200 - localeIndex * 10;
  } else if (language.startsWith('en')) {
    score += 100;
  } else {
    return -1;
  }

  if (voice.quality === VoiceQuality.Enhanced) {
    score += 80;
  } else if (voice.quality === VoiceQuality.Default) {
    score += 20;
  }

  return score;
}

function voiceFromSelection(voice: Voice, source: ResolvedSpeechVoice['source']): ResolvedSpeechVoice {
  return {
    identifier: voice.identifier,
    language: voice.language || DEFAULT_SPEECH_LANGUAGE,
    name: voice.name,
    quality: voice.quality,
    source,
  };
}

async function pickBestEnglishVoice(
  voices: Voice[],
  preferredLanguage?: string
): Promise<ResolvedSpeechVoice> {
  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (preferredLanguage) {
    const preferred = ranked.find(({ voice }) =>
      voice.language?.toLowerCase().startsWith(preferredLanguage.toLowerCase())
    );
    if (preferred) {
      const source = preferred.voice.quality === VoiceQuality.Enhanced ? 'enhanced' : 'english';
      return voiceFromSelection(preferred.voice, source);
    }
  }

  const enhanced = ranked.find(({ voice }) => voice.quality === VoiceQuality.Enhanced);
  if (enhanced) {
    return voiceFromSelection(enhanced.voice, 'enhanced');
  }

  if (ranked[0]) {
    return voiceFromSelection(ranked[0].voice, 'english');
  }

  return {
    language: preferredLanguage || DEFAULT_SPEECH_LANGUAGE,
    source: 'default',
  };
}

export async function resolveSpeechVoice(
  preferences: AgentSpeechPreferences = {}
): Promise<ResolvedSpeechVoice> {
  if (preferences.voiceIdentifier) {
    return {
      identifier: preferences.voiceIdentifier,
      language: preferences.language || DEFAULT_SPEECH_LANGUAGE,
      source: 'preference',
    };
  }

  if (cachedVoice) {
    return cachedVoice;
  }

  if (!voiceResolutionPromise) {
    voiceResolutionPromise = (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const resolved = await pickBestEnglishVoice(voices, preferences.language);
        cachedVoice = resolved;
        return resolved;
      } catch (err) {
        console.warn('Failed to resolve speech voice:', err);
        const fallback: ResolvedSpeechVoice = {
          language: preferences.language || DEFAULT_SPEECH_LANGUAGE,
          source: 'default',
        };
        cachedVoice = fallback;
        return fallback;
      } finally {
        voiceResolutionPromise = null;
      }
    })();
  }

  return voiceResolutionPromise;
}

export function getSpeechRate(preferences?: AgentSpeechPreferences): number {
  const rate = preferences?.rate;
  if (typeof rate === 'number' && rate >= 0.5 && rate <= 1.5) {
    return rate;
  }
  return DEFAULT_SPEECH_RATE;
}

export function getCachedSpeechVoice(): ResolvedSpeechVoice | null {
  return cachedVoice;
}

export function resetSpeechVoiceCache(): void {
  cachedVoice = null;
  voiceResolutionPromise = null;
}
