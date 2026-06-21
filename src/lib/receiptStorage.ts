/** Client-safe receipt storage constants (no secrets). */

export const RECEIPT_STORAGE_BUCKET = 'receipt-scans';

export function receiptStoragePathForUser(userId: string, receiptId: string): string {
  return `${userId}/${receiptId}.jpg`;
}
