/**
 * Receipt image storage (service-role upload/delete only).
 */

import { createServiceClient } from '../supabaseServer';
import { RECEIPT_STORAGE_BUCKET, receiptStoragePath } from './receiptConfig';

export async function uploadReceiptImage(
  userId: string,
  receiptId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const path = receiptStoragePath(userId, receiptId);
  const supabase = createServiceClient();

  const { error } = await supabase.storage.from(RECEIPT_STORAGE_BUCKET).upload(path, buffer, {
    contentType: contentType === 'image/heic' ? 'image/jpeg' : contentType,
    upsert: false,
  });

  if (error) {
    console.error('Receipt image upload failed');
    throw new Error('Could not store receipt image. Please try again.');
  }

  return path;
}

export async function deleteReceiptImage(userId: string, receiptId: string): Promise<void> {
  const path = receiptStoragePath(userId, receiptId);
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(RECEIPT_STORAGE_BUCKET).remove([path]);
  if (error) {
    console.error('Receipt image delete failed');
  }
}
