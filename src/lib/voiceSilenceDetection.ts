/**
 * Adaptive silence detection for voice recording using expo-audio metering.
 * Metering is available on RecorderState.metering when isMeteringEnabled is true.
 */

export const SILENCE_DETECTION_CONFIG = {
  calibrationMs: 600,
  initialSilenceMs: 5000,
  endSilenceMs: 1800,
  minSpeechMs: 450,
  consecutiveSpeechFramesRequired: 4,
  pollMs: 100,
  minThresholdDeltaDb: 8,
  minThresholdDeltaNormalized: 0.14,
  meteringProbeMs: 2000,
} as const;

export type SilenceTickResult = 'continue' | 'end_silence';

export function isDecibelMeter(raw: number): boolean {
  return raw <= 0 && raw >= -160;
}

/**
 * Normalize raw metering to 0..1 for visualization.
 */
export function normalizeMetering(raw: number): number {
  if (isDecibelMeter(raw)) {
    return clamp01((raw + 50) / 50);
  }
  if (raw > 1 && raw <= 32767) {
    return clamp01(raw / 12000);
  }
  if (raw >= 0 && raw <= 1) {
    return raw;
  }
  return clamp01(Math.abs(raw) / 100);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export class SilenceDetector {
  private rawBaselineSamples: number[] = [];
  private normalizedBaselineSamples: number[] = [];
  private calibrated = false;
  private baselineDb = -45;
  private baselineNormalized = 0.12;
  private thresholdDb = -35;
  private thresholdNormalized = 0.28;
  private speechDetected = false;
  private speechAccumMs = 0;
  private silenceAccumMs = 0;
  private consecutiveSpeechFrames = 0;
  private displayLevel = 0;
  private sawMetering = false;
  private usesDecibel = false;
  private lastRawMeter: number | undefined;

  constructor(private readonly config = SILENCE_DETECTION_CONFIG) {}

  reset(): void {
    this.rawBaselineSamples = [];
    this.normalizedBaselineSamples = [];
    this.calibrated = false;
    this.baselineDb = -45;
    this.baselineNormalized = 0.12;
    this.thresholdDb = -35;
    this.thresholdNormalized = 0.28;
    this.speechDetected = false;
    this.speechAccumMs = 0;
    this.silenceAccumMs = 0;
    this.consecutiveSpeechFrames = 0;
    this.displayLevel = 0;
    this.sawMetering = false;
    this.usesDecibel = false;
    this.lastRawMeter = undefined;
  }

  getDisplayLevel(): number {
    return this.displayLevel;
  }

  hasReceivedMetering(): boolean {
    return this.sawMetering;
  }

  getSpeechDetected(): boolean {
    return this.speechDetected;
  }

  getLastRawMeter(): number | undefined {
    return this.lastRawMeter;
  }

  private calibrate(): void {
    if (this.usesDecibel) {
      this.baselineDb = median(this.rawBaselineSamples);
      this.thresholdDb = this.baselineDb + this.config.minThresholdDeltaDb;
    } else {
      this.baselineNormalized = median(this.normalizedBaselineSamples);
      this.thresholdNormalized = clamp01(
        this.baselineNormalized + this.config.minThresholdDeltaNormalized
      );
    }
    this.calibrated = true;
  }

  private isSpeechFrame(raw: number, normalized: number): boolean {
    if (this.usesDecibel) {
      return raw > this.thresholdDb;
    }
    return normalized > this.thresholdNormalized;
  }

  tick(rawMetering: number | undefined, elapsedMs: number): SilenceTickResult {
    if (rawMetering !== undefined && Number.isFinite(rawMetering)) {
      this.sawMetering = true;
      this.lastRawMeter = rawMetering;

      if (!this.usesDecibel && isDecibelMeter(rawMetering)) {
        this.usesDecibel = true;
      }

      const normalized = normalizeMetering(rawMetering);
      this.displayLevel = normalized;

      if (!this.calibrated) {
        this.rawBaselineSamples.push(rawMetering);
        this.normalizedBaselineSamples.push(normalized);
        if (elapsedMs >= this.config.calibrationMs) {
          this.calibrate();
        }
      }

      if (this.calibrated) {
        const isSpeech = this.isSpeechFrame(rawMetering, normalized);

        if (isSpeech) {
          this.consecutiveSpeechFrames += 1;
          this.silenceAccumMs = 0;

          if (this.consecutiveSpeechFrames >= this.config.consecutiveSpeechFramesRequired) {
            this.speechAccumMs += this.config.pollMs;
            if (this.speechAccumMs >= this.config.minSpeechMs) {
              this.speechDetected = true;
            }
          }
        } else {
          this.consecutiveSpeechFrames = 0;
          if (this.speechDetected) {
            this.silenceAccumMs += this.config.pollMs;
          }
        }
      }
    }

    if (this.speechDetected && this.silenceAccumMs >= this.config.endSilenceMs) {
      return 'end_silence';
    }

    return 'continue';
  }
}
