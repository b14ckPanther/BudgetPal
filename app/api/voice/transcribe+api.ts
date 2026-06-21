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
import { apiErrorResponse, handleApiRouteError } from '../../../src/server/apiErrors';

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const { supabase, userId } = await authenticateRequest(request);

    let formData: { get(name: string): FormDataEntryValue | null };
    try {
      formData = (await request.formData()) as unknown as {
        get(name: string): FormDataEntryValue | null;
      };
    } catch {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const audioField = formData.get('audio') as Blob | string | null;
    if (!audioField || typeof audioField === 'string') {
      return apiErrorResponse('INVALID_INPUT', 400);
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
        return apiErrorResponse('INVALID_INPUT', err.statusCode);
      }
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    let mimeType: string;
    try {
      const validated = validateAudioBlob(audioField, durationMs);
      mimeType = validated.mimeType;
    } catch (err) {
      if (err instanceof VoiceUploadError) {
        return apiErrorResponse('INVALID_INPUT', err.statusCode);
      }
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    let buffer: Buffer;
    try {
      buffer = await blobToBuffer(audioField);
    } catch (err) {
      if (err instanceof VoiceUploadError) {
        return apiErrorResponse('INVALID_INPUT', err.statusCode);
      }
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    let transcription: string;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .maybeSingle();
      const languageHint = profile?.preferred_language === 'he' ? 'he' : 'en';
      transcription = await transcribeAudioBuffer(buffer, mimeType, languageHint);
    } catch {
      return apiErrorResponse('SERVICE_UNAVAILABLE', 422);
    }

    const result = await processAgentMessage(supabase, userId, transcription, {
      channel: 'voice',
    });

    return Response.json(result);
  } catch (error: unknown) {
    return handleApiRouteError('voice-transcribe', error);
  }
}
