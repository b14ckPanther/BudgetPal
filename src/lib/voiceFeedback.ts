/**
 * Haptic feedback for voice recording UX.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function runHaptic(fn: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Haptics are optional; ignore unsupported devices.
  }
}

export async function hapticRecordingStart(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export async function hapticRecordingStop(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export async function hapticPreviewReady(): Promise<void> {
  await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export async function hapticVoiceError(): Promise<void> {
  await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export async function hapticRecordingCancelled(): Promise<void> {
  await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
}
