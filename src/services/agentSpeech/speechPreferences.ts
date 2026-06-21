/**
 * Session voice selection and Profile speech preferences.
 */

import * as Speech from 'expo-speech';
import { Voice, VoiceQuality } from 'expo-speech';

export interface AgentSpeechPreferences {
  language?: string;
  voiceIdentifier?: string;
  rate?: number;
  profileCurrency?: string;
}

export interface ResolvedSpeechVoice {
  identifier?: string;
  language: string;
  name?: string;
  quality?: VoiceQuality | string;
  source: 'preference' | 'enhanced' | 'locale' | 'default';
}

const ENGLISH_LOCALE_PRIORITY = ['en-US', 'en-GB', 'en-AU', 'en-IE', 'en-CA', 'en-IN', 'en'];
const HEBREW_LOCALE_PRIORITY = ['he-IL', 'he'];

const DEFAULT_SPEECH_RATE = 0.94;
const DEFAULT_SPEECH_LANGUAGE = 'en-US';
const DEFAULT_HEBREW_SPEECH_LANGUAGE = 'he-IL';

let cachedVoice: ResolvedSpeechVoice | null = null;
let voiceResolutionPromise: Promise<ResolvedSpeechVoice> | null = null;
let cachedLocaleKey: string | null = null;

function isHebrewLanguage(language?: string): boolean {
  return (language || '').toLowerCase().startsWith('he');
}

function scoreVoice(voice: Voice, localePriority: string[]): number {
  const language = (voice.language || '').toLowerCase();
  let score = 0;

  const localeIndex = localePriority.findIndex(
    (locale) => language === locale.toLowerCase() || language.startsWith(`${locale.toLowerCase()}-`)
  );
  if (localeIndex >= 0) {
    score += 200 - localeIndex * 10;
  } else if (localePriority === ENGLISH_LOCALE_PRIORITY && language.startsWith('en')) {
    score += 100;
  } else if (localePriority === HEBREW_LOCALE_PRIORITY && language.startsWith('he')) {
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

async function pickBestVoice(
  voices: Voice[],
  preferredLanguage?: string
): Promise<ResolvedSpeechVoice> {
  const hebrew = isHebrewLanguage(preferredLanguage);
  const localePriority = hebrew ? HEBREW_LOCALE_PRIORITY : ENGLISH_LOCALE_PRIORITY;
  const fallbackLanguage = hebrew ? DEFAULT_HEBREW_SPEECH_LANGUAGE : DEFAULT_SPEECH_LANGUAGE;

  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice, localePriority) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (preferredLanguage) {
    const preferred = ranked.find(({ voice }) =>
      voice.language?.toLowerCase().startsWith(preferredLanguage.toLowerCase().split('-')[0])
    );
    if (preferred) {
      const source = preferred.voice.quality === VoiceQuality.Enhanced ? 'enhanced' : 'locale';
      return voiceFromSelection(preferred.voice, source);
    }
  }

  const enhanced = ranked.find(({ voice }) => voice.quality === VoiceQuality.Enhanced);
  if (enhanced) {
    return voiceFromSelection(enhanced.voice, 'enhanced');
  }

  if (ranked[0]) {
    return voiceFromSelection(ranked[0].voice, 'locale');
  }

  return {
    language: preferredLanguage || fallbackLanguage,
    source: 'default',
  };
}

export async function resolveSpeechVoice(
  preferences: AgentSpeechPreferences = {}
): Promise<ResolvedSpeechVoice> {
  const localeKey = preferences.language || 'en-US';

  if (preferences.voiceIdentifier) {
    return {
      identifier: preferences.voiceIdentifier,
      language: preferences.language || DEFAULT_SPEECH_LANGUAGE,
      source: 'preference',
    };
  }

  if (cachedVoice && cachedLocaleKey === localeKey) {
    return cachedVoice;
  }

  if (!voiceResolutionPromise) {
    voiceResolutionPromise = (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const resolved = await pickBestVoice(voices, preferences.language);
        cachedVoice = resolved;
        cachedLocaleKey = localeKey;
        return resolved;
      } catch (err) {
        console.warn('Failed to resolve speech voice:', err);
        const fallback: ResolvedSpeechVoice = {
          language: preferences.language || DEFAULT_SPEECH_LANGUAGE,
          source: 'default',
        };
        cachedVoice = fallback;
        cachedLocaleKey = localeKey;
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
  cachedLocaleKey = null;
}
