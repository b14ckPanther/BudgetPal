import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { AgentResponse } from '@/types/agent';
import { RECEIPT_STORAGE_BUCKET } from '@/lib/receiptStorage';

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8081`;
  }

  return 'http://localhost:8081';
};

export async function scanReceiptImage(uri: string, mimeType: string): Promise<AgentResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('User session not found');
  }

  const token = sessionData.session.access_token;
  const url = `${getApiUrl()}/api/receipts/scan`;

  const formData = new FormData();
  formData.append('image', {
    uri,
    type: mimeType,
    name: 'receipt.jpg',
  } as unknown as Blob);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let resBody: { error?: string } & Partial<AgentResponse> = {};
  try {
    resBody = await response.json();
  } catch {
    throw new Error('Could not scan this receipt. Please try again.');
  }

  if (!response.ok || resBody.error) {
    throw new Error(resBody.error || 'Could not scan this receipt. Please try again.');
  }

  return resBody as AgentResponse;
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
