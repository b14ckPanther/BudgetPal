/**
 * OpenAI Whisper transcription (server-only).
 */

import OpenAI, { toFile } from 'openai';
import { extensionForMime } from './validateAudioUpload';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export async function transcribeAudioBuffer(
  buffer: Buffer,
  mimeType: string,
  languageHint: 'en' | 'he' = 'en'
): Promise<string> {
  const client = getClient();
  const ext = extensionForMime(mimeType);
  const file = await toFile(buffer, `recording.${ext}`, { type: mimeType });

  const result = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: languageHint,
  });

  const text = result.text?.trim();
  if (!text) {
    throw new Error('Empty transcription');
  }
  return text;
}
