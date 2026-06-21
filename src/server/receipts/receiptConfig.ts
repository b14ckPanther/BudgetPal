/**
 * Receipt vision model configuration (server-only).
 * Change RECEIPT_VISION_MODEL in one place after real receipt testing.
 */

import { RECEIPT_STORAGE_BUCKET, receiptStoragePathForUser } from '../../lib/receiptStorage';

export const RECEIPT_VISION_MODEL =
  process.env.RECEIPT_VISION_MODEL?.trim() || 'gpt-4o-mini';

export { RECEIPT_STORAGE_BUCKET };

export function receiptStoragePath(userId: string, receiptId: string): string {
  return receiptStoragePathForUser(userId, receiptId);
}
