/**
 * Development-only voice recording diagnostics.
 */

export type VoiceStopReason =
  | 'manual_stop'
  | 'auto_stop_after_speech'
  | 'no_speech_timeout'
  | 'cancel'
  | 'failure';

export function voiceDevLog(message: string, data?: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (data) {
    console.log(`[Voice] ${message}`, data);
  } else {
    console.log(`[Voice] ${message}`);
  }
}
