import { supabase } from '@/lib/supabase';
import { VoiceEntry } from '@/types/api';
import { AgentResponse } from '@/types/agent';
import { Database } from '@/types/database';
import { mapVoiceEntry } from '../mapper';
import { apiFetch } from '@/lib/apiFetch';

export async function transcribeVoiceAudio(
  uri: string,
  durationMs: number,
  mimeType: string,
  speechDetected: boolean
): Promise<AgentResponse & { transcription?: string }> {
  if (!speechDetected) {
    throw new Error('No speech was detected in this recording. Please try again.');
  }

  const extension = mimeType.includes('webm') ? 'webm' : 'm4a';
  const formData = new FormData();
  formData.append('audio', {
    uri,
    type: mimeType,
    name: `recording.${extension}`,
  } as unknown as Blob);
  formData.append('durationMs', String(Math.round(durationMs)));
  formData.append('speechDetected', speechDetected ? 'true' : 'false');

  return apiFetch<AgentResponse & { transcription?: string }>('/api/voice/transcribe', {
    method: 'POST',
    body: formData,
  });
}

export async function createVoiceEntry(entry: Partial<VoiceEntry>): Promise<VoiceEntry> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbInsert = {
    user_id: user.id,
    audio_url: entry.audioUrl || null,
    transcription: entry.transcription || null,
    interpreted_payload: (entry.interpretedPayload || {}) as Database['public']['Tables']['voice_entries']['Insert']['interpreted_payload'],
    confidence: entry.confidence !== undefined ? entry.confidence : null,
    status: entry.status || 'pending_review',
  };

  const { data, error } = await supabase
    .from('voice_entries')
    .insert(dbInsert)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create voice entry');
  }

  return mapVoiceEntry(data);
}

export async function updateVoiceEntryStatus(
  id: string,
  status: 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted'
): Promise<VoiceEntry> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const dbUpdate: Database['public']['Tables']['voice_entries']['Update'] = {
    status,
  };

  const { data, error } = await supabase
    .from('voice_entries')
    .update(dbUpdate)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update voice entry status');
  }

  return mapVoiceEntry(data);
}
