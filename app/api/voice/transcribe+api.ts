import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { processAgentMessage } from '../../../src/server/agent/processAgentMessage';
import {
  VoiceUploadError,
  validateAudioBlob,
  blobToBuffer,
  validateSpeechDetectedFlag,
} from '../../../src/server/voice/validateAudioUpload';
import { transcribeAudioBuffer } from '../../../src/server/voice/transcribeAudio';

const TRANSCRIBE_FAILED = 'We could not transcribe your recording. Please try again.';
const INVALID_UPLOAD = 'We could not process that recording. Please try again.';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let formData: { get(name: string): FormDataEntryValue | null };
    try {
      formData = (await request.formData()) as unknown as {
        get(name: string): FormDataEntryValue | null;
      };
    } catch {
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    const audioField = formData.get('audio') as Blob | string | null;
    if (!audioField || typeof audioField === 'string') {
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    const durationRaw = formData.get('durationMs');
    const durationMs =
      typeof durationRaw === 'string' && durationRaw.length > 0
        ? Number(durationRaw)
        : undefined;

    try {
      validateSpeechDetectedFlag(formData.get('speechDetected'));
    } catch (err) {
      if (err instanceof VoiceUploadError) {
        return Response.json({ error: err.userMessage }, { status: err.statusCode });
      }
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    let mimeType: string;
    try {
      const validated = validateAudioBlob(audioField, durationMs);
      mimeType = validated.mimeType;
    } catch (err) {
      if (err instanceof VoiceUploadError) {
        return Response.json({ error: err.userMessage }, { status: err.statusCode });
      }
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      buffer = await blobToBuffer(audioField);
    } catch (err) {
      if (err instanceof VoiceUploadError) {
        return Response.json({ error: err.userMessage }, { status: err.statusCode });
      }
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    let transcription: string;
    try {
      transcription = await transcribeAudioBuffer(buffer, mimeType);
    } catch (err) {
      console.error('Transcription error:', err);
      return Response.json({ error: TRANSCRIBE_FAILED }, { status: 422 });
    }

    const result = await processAgentMessage(supabase, userId, transcription, {
      channel: 'voice',
    });

    return Response.json(result);
  } catch (error: unknown) {
    console.error('Error in voice transcribe route:', error);
    const err = error as { statusCode?: number; message?: string; name?: string };
    if (err.name === 'AuthError') {
      return Response.json({ error: 'Please sign in again to continue.' }, { status: err.statusCode || 401 });
    }
    return Response.json({ error: TRANSCRIBE_FAILED }, { status: 500 });
  }
}
