/**
 * Server-side validation for receipt image uploads.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/octet-stream',
]);

export class ReceiptUploadError extends Error {
  statusCode: number;
  userMessage: string;

  constructor(userMessage: string, statusCode = 400) {
    super(userMessage);
    this.name = 'ReceiptUploadError';
    this.userMessage = userMessage;
    this.statusCode = statusCode;
  }
}

export function validateImageBlob(blob: Blob): { mimeType: string; size: number } {
  const size = blob.size;
  if (!size || size < MIN_BYTES) {
    throw new ReceiptUploadError('That image looks too small. Please try another receipt photo.');
  }
  if (size > MAX_BYTES) {
    throw new ReceiptUploadError('That image is too large. Please use a smaller receipt photo.');
  }

  const mimeType = (blob.type || 'application/octet-stream').toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ReceiptUploadError('Unsupported image type. Please use a JPEG or PNG receipt photo.');
  }

  return { mimeType, size };
}

export async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > MAX_BYTES) {
    throw new ReceiptUploadError('That image is too large. Please use a smaller receipt photo.');
  }
  if (buffer.length < MIN_BYTES) {
    throw new ReceiptUploadError('That image looks too small. Please try another receipt photo.');
  }
  return buffer;
}

export function normalizeImageMime(mimeType: string): string {
  const lower = mimeType.toLowerCase().split(';')[0].trim();
  if (lower === 'image/jpg' || lower === 'application/octet-stream') return 'image/jpeg';
  if (lower === 'image/heif') return 'image/heic';
  return lower;
}
