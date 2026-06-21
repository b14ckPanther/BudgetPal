import { supabase } from '@/lib/supabase';
import { AgentResponse } from '@/types/agent';
import { RECEIPT_STORAGE_BUCKET } from '@/lib/receiptStorage';
import { apiFetch } from '@/lib/apiFetch';

export async function scanReceiptImage(uri: string, mimeType: string): Promise<AgentResponse> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    type: mimeType,
    name: 'receipt.jpg',
  } as unknown as Blob);

  return apiFetch<AgentResponse>('/api/receipts/scan', {
    method: 'POST',
    body: formData,
  });
}

export async function getReceiptThumbnailUrl(receiptId: string): Promise<string | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const path = `${user.id}/${receiptId}.jpg`;
  const { data, error } = await supabase.storage
    .from(RECEIPT_STORAGE_BUCKET)
    .createSignedUrl(path, 300);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
