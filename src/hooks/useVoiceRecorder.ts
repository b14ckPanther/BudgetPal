/**
 * Voice recording hook using expo-audio (SDK 54) with adaptive silence detection.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  type RecordingOptions,
} from 'expo-audio';
import { t } from '@/lib/i18n';
import {
  SilenceDetector,
  SILENCE_DETECTION_CONFIG,
  normalizeMetering,
} from '@/lib/voiceSilenceDetection';
import { voiceDevLog, type VoiceStopReason } from '@/lib/voiceDevLog';
import {
  hapticRecordingStart,
  hapticRecordingStop,
  hapticVoiceError,
  hapticRecordingCancelled,
} from '@/lib/voiceFeedback';

export type VoiceRecorderState =
  | 'idle'
  | 'listening'
  | 'auto_stopping'
  | 'transcribing'
  | 'no_speech'
  | 'failed'
  | 'cancelled';

const MAX_DURATION_SEC = 60;

const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
};

export interface VoiceRecordingResult {
  uri: string;
  durationMs: number;
  mimeType: string;
  speechDetected: boolean;
}

export interface UseVoiceRecorderOptions {
  onAutoStop?: (result: VoiceRecordingResult) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, SILENCE_DETECTION_CONFIG.pollMs);
  const [uiState, setUiState] = useState<VoiceRecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meterLevel, setMeterLevel] = useState(0);
  const [silenceDetectionEnabled, setSilenceDetectionEnabled] = useState(true);

  const cancelledRef = useRef(false);
  const stopInFlightRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceDetectorRef = useRef(new SilenceDetector());
  const onAutoStopRef = useRef(options.onAutoStop);
  const speechDetectedLoggedRef = useRef(false);

  onAutoStopRef.current = options.onAutoStop;

  const clearMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, []);

  const logStop = useCallback((reason: VoiceStopReason, extra?: Record<string, unknown>) => {
    voiceDevLog('stop', { reason, ...extra });
  }, []);

  const reset = useCallback(() => {
    clearMonitoring();
    setUiState('idle');
    setErrorMessage(null);
    setMeterLevel(0);
    cancelledRef.current = false;
    stopInFlightRef.current = false;
    sessionEndedRef.current = false;
    recordingStartedAtRef.current = null;
    speechDetectedLoggedRef.current = false;
    silenceDetectorRef.current.reset();
  }, [clearMonitoring]);

  const setFailed = useCallback((message: string, reason: VoiceStopReason = 'failure') => {
    clearMonitoring();
    logStop(reason, { message });
    setErrorMessage(message);
    setUiState('failed');
    sessionEndedRef.current = true;
  }, [clearMonitoring, logStop]);

  const discardActiveRecording = useCallback(async () => {
    try {
      const status = recorder.getStatus();
      if (status.isRecording || recorder.isRecording) {
        await recorder.stop();
      }
    } catch (err) {
      console.error('Failed to discard recording:', err);
    }
  }, [recorder]);

  const handleNoSpeechTimeout = useCallback(async (reason: VoiceStopReason = 'no_speech_timeout') => {
    if (sessionEndedRef.current || stopInFlightRef.current) return;
    sessionEndedRef.current = true;
    stopInFlightRef.current = true;
    clearMonitoring();

    logStop(reason, {
      elapsedMs: recordingStartedAtRef.current
        ? Date.now() - recordingStartedAtRef.current
        : 0,
      speechDetected: false,
    });

    await hapticVoiceError();
    await discardActiveRecording();
    setErrorMessage(t('voice.noSpeech'));
    setUiState('no_speech');
    stopInFlightRef.current = false;
  }, [clearMonitoring, discardActiveRecording, logStop]);

  const finalizeRecording = useCallback(
    async (reason: 'manual' | 'auto'): Promise<VoiceRecordingResult | null> => {
      if (sessionEndedRef.current || stopInFlightRef.current) return null;
      stopInFlightRef.current = true;
      clearMonitoring();

      const speechDetected = silenceDetectorRef.current.getSpeechDetected();

      if (!speechDetected) {
        logStop(reason === 'manual' ? 'manual_stop' : 'auto_stop_after_speech', {
          speechDetected: false,
          rejected: true,
        });
        stopInFlightRef.current = false;
        await handleNoSpeechTimeout(reason === 'manual' ? 'manual_stop' : 'no_speech_timeout');
        return null;
      }

      if (reason === 'auto') {
        setUiState('auto_stopping');
      } else {
        setUiState('transcribing');
      }

      await hapticRecordingStop();

      try {
        if (cancelledRef.current) {
          reset();
          return null;
        }

        const status = recorder.getStatus();
        if (status.isRecording || recorder.isRecording) {
          await recorder.stop();
        }

        const uri = recorder.uri;
        const durationMs = Math.min(
          status.durationMillis || recorderState.durationMillis || 0,
          MAX_DURATION_SEC * 1000
        );

        if (!uri) {
          setFailed(t('voice.recordFailed'));
          return null;
        }

        if (durationMs < 500) {
          setFailed(t('voice.tooShort'));
          return null;
        }

        sessionEndedRef.current = true;
        logStop(reason === 'manual' ? 'manual_stop' : 'auto_stop_after_speech', {
          speechDetected: true,
          durationMs,
        });

        return {
          uri,
          durationMs,
          mimeType: Platform.OS === 'android' ? 'audio/mp4' : 'audio/m4a',
          speechDetected: true,
        };
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setFailed(t('voice.recordFailed'));
        return null;
      } finally {
        stopInFlightRef.current = false;
      }
    },
    [
      clearMonitoring,
      handleNoSpeechTimeout,
      logStop,
      recorder,
      recorderState.durationMillis,
      reset,
      setFailed,
    ]
  );

  const handleAutoSilenceStop = useCallback(async () => {
    if (sessionEndedRef.current || stopInFlightRef.current || cancelledRef.current) return;

    const result = await finalizeRecording('auto');
    if (!result) return;

    setUiState('transcribing');
    onAutoStopRef.current?.(result);
  }, [finalizeRecording]);

  const startMonitoring = useCallback(() => {
    clearMonitoring();
    const detector = silenceDetectorRef.current;
    detector.reset();
    speechDetectedLoggedRef.current = false;
    let lastMeterLogAt = 0;

    monitoringIntervalRef.current = setInterval(() => {
      if (sessionEndedRef.current || stopInFlightRef.current || cancelledRef.current) return;

      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;

      const elapsedMs = Date.now() - startedAt;
      const status = recorder.getStatus();
      const tickResult = detector.tick(status.metering, elapsedMs);

      setMeterLevel(detector.getDisplayLevel());

      const speechDetected = detector.getSpeechDetected();
      if (speechDetected && !speechDetectedLoggedRef.current) {
        speechDetectedLoggedRef.current = true;
        voiceDevLog('speechDetected', {
          elapsedMs,
          rawMeter: detector.getLastRawMeter(),
          normalized: detector.getDisplayLevel(),
        });
      }

      if (__DEV__ && elapsedMs - lastMeterLogAt >= 500) {
        lastMeterLogAt = elapsedMs;
        voiceDevLog('meter', {
          elapsedMs,
          raw: status.metering,
          normalized: normalizeMetering(status.metering ?? detector.getLastRawMeter() ?? -160),
          speechDetected,
          meteringActive: detector.hasReceivedMetering(),
        });
      }

      if (
        elapsedMs >= SILENCE_DETECTION_CONFIG.meteringProbeMs &&
        !detector.hasReceivedMetering()
      ) {
        setSilenceDetectionEnabled(false);
        voiceDevLog('meteringUnavailable', { elapsedMs });
      }

      if (!speechDetected && elapsedMs >= SILENCE_DETECTION_CONFIG.initialSilenceMs) {
        voiceDevLog('silenceTimeout', { elapsedMs, metering: detector.hasReceivedMetering() });
        void handleNoSpeechTimeout('no_speech_timeout');
        return;
      }

      if (tickResult === 'end_silence' && speechDetected) {
        void handleAutoSilenceStop();
        return;
      }

      if (speechDetected && elapsedMs >= MAX_DURATION_SEC * 1000) {
        void handleAutoSilenceStop();
      }
    }, SILENCE_DETECTION_CONFIG.pollMs);
  }, [clearMonitoring, handleAutoSilenceStop, handleNoSpeechTimeout, recorder]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setFailed(t('voice.unavailableWeb'));
      return false;
    }

    reset();

    const existing = await getRecordingPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      const requested = await requestRecordingPermissionsAsync();
      granted = requested.granted;
    }

    if (!granted) {
      setFailed(t('voice.permissionDenied'));
      return false;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
      });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_DURATION_SEC });

      recordingStartedAtRef.current = Date.now();
      setSilenceDetectionEnabled(true);
      setUiState('listening');
      startMonitoring();

      voiceDevLog('recordingStarted', {
        timestamp: recordingStartedAtRef.current,
        meteringEnabled: true,
      });

      await hapticRecordingStart();
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      clearMonitoring();
      setFailed(t('voice.recordFailed'));
      return false;
    }
  }, [clearMonitoring, recorder, reset, setFailed, startMonitoring]);

  const cancelRecording = useCallback(async () => {
    if (sessionEndedRef.current || stopInFlightRef.current) return;
    cancelledRef.current = true;
    sessionEndedRef.current = true;
    stopInFlightRef.current = true;
    clearMonitoring();

    logStop('cancel');
    await hapticRecordingCancelled();
    await discardActiveRecording();
    setUiState('cancelled');
    stopInFlightRef.current = false;

    setTimeout(() => {
      reset();
    }, 1200);
  }, [clearMonitoring, discardActiveRecording, logStop, reset]);

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    if (cancelledRef.current || sessionEndedRef.current) {
      return null;
    }
    if (stopInFlightRef.current) return null;
    return finalizeRecording('manual');
  }, [finalizeRecording]);

  const markTranscribing = useCallback(() => {
    setUiState('transcribing');
  }, []);

  const markPreviewReady = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    return () => {
      clearMonitoring();
    };
  }, [clearMonitoring]);

  return {
    uiState,
    errorMessage,
    elapsedMs: recorderState.durationMillis,
    meterLevel,
    silenceDetectionEnabled,
    isRecording: uiState === 'listening',
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    setFailed,
    markTranscribing,
    markPreviewReady,
  };
}
