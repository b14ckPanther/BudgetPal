/**
 * Expo audio session helpers for voice capture vs agent TTS playback.
 * Recording uses PlayAndRecord; playback should leave recording mode afterward.
 */

import { Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    shouldPlayInBackground: false,
    ...(Platform.OS === 'android' ? { shouldRouteThroughEarpiece: false } : {}),
  });
}

export async function restorePlaybackAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    shouldPlayInBackground: false,
    ...(Platform.OS === 'android' ? { shouldRouteThroughEarpiece: false } : {}),
  });
}
