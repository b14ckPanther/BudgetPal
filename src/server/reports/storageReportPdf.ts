/**
 * Private report PDF upload/delete (service role).
 */

import { createServiceClient } from '../supabaseServer';
import { REPORT_STORAGE_BUCKET, reportStoragePath } from './reportConfig';

export async function uploadReportPdf(
  userId: string,
  reportId: string,
  buffer: Buffer
): Promise<string> {
  const path = reportStoragePath(userId, reportId);
  const supabase = createServiceClient();

  const { error } = await supabase.storage.from(REPORT_STORAGE_BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (error) {
    console.error('Report PDF upload failed');
    throw new Error('Could not store report PDF.');
  }

  return path;
}

export async function deleteReportPdf(userId: string, reportId: string): Promise<void> {
  const path = reportStoragePath(userId, reportId);
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(REPORT_STORAGE_BUCKET).remove([path]);
  if (error) {
    console.error('Report PDF delete failed');
  }
}

export async function createReportDownloadUrl(
  storagePath: string,
  expiresInSeconds = 60
): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(REPORT_STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('Report signed URL creation failed');
    throw new Error('Could not prepare report download.');
  }

  return data.signedUrl;
}
