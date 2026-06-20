/**
 * Server-side validation for voice audio uploads.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DURATION_MS = 60_000;
const MIN_BYTES = 512;
const MIN_DURATION_MS = 800;

const ALLOWED_MIME_TYPES = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'application/octet-stream',
]);

export class VoiceUploadError extends Error {
  statusCode: number;
  userMessage: string;

  constructor(userMessage: string, statusCode = 400) {
    super(userMessage);
    this.name = 'VoiceUploadError';
    this.userMessage = userMessage;
    this.statusCode = statusCode;
  }
}

export function validateAudioBlob(
  blob: Blob,
  durationMs?: number | null
): { mimeType: string; size: number } {
  const size = blob.size;
  if (!size || size < MIN_BYTES) {
    throw new VoiceUploadError('Recording was too short. Please try speaking again.');
  }
  if (size > MAX_BYTES) {
    throw new VoiceUploadError('Recording is too large. Please keep it under one minute.');
  }

  const mimeType = (blob.type || 'application/octet-stream').toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new VoiceUploadError('Unsupported audio format. Please try recording again.');
  }

  if (durationMs != null) {
    const parsed = Number(durationMs);
    if (!Number.isFinite(parsed) || parsed < MIN_DURATION_MS || parsed > MAX_DURATION_MS) {
      throw new VoiceUploadError(
        parsed < MIN_DURATION_MS
          ? 'Recording was too short. Please try speaking again.'
          : 'Recording is too long. Please keep it under one minute.'
      );
    }
  }

  return { mimeType, size };
}

export function validateSpeechDetectedFlag(value: FormDataEntryValue | null): void {
  if (value !== 'true') {
    throw new VoiceUploadError('No speech was detected in this recording. Please try again.');
  }
}

export async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > MAX_BYTES) {
    throw new VoiceUploadError('Recording is too large. Please keep it under one minute.');
  }
  if (buffer.length < MIN_BYTES) {
    throw new VoiceUploadError('Recording was too short. Please try speaking again.');
  }
  return buffer;
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'audio/webm':
      return 'webm';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    default:
      return 'm4a';
  }
}
