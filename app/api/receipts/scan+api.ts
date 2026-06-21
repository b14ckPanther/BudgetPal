import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { processReceiptScan } from '../../../src/server/receipts/processReceiptScan';
import {
  ReceiptUploadError,
  validateImageBlob,
  blobToBuffer,
} from '../../../src/server/receipts/validateImageUpload';

const SCAN_FAILED = 'Could not scan this receipt. Please try a clearer photo.';
const INVALID_UPLOAD = 'Could not process that image. Please try another receipt photo.';

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

    const imageField = formData.get('image') as Blob | string | null;
    if (!imageField || typeof imageField === 'string') {
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    let mimeType: string;
    try {
      const validated = validateImageBlob(imageField);
      mimeType = validated.mimeType;
    } catch (err) {
      if (err instanceof ReceiptUploadError) {
        return Response.json({ error: err.userMessage }, { status: err.statusCode });
      }
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      buffer = await blobToBuffer(imageField);
    } catch (err) {
      if (err instanceof ReceiptUploadError) {
        return Response.json({ error: err.userMessage }, { status: err.statusCode });
      }
      return Response.json({ error: INVALID_UPLOAD }, { status: 400 });
    }

    const result = await processReceiptScan(supabase, userId, buffer, mimeType);
    return Response.json(result);
  } catch (error: unknown) {
    console.error('Error in receipts scan route:', error);
    const err = error as { statusCode?: number; message?: string; name?: string };
    if (err.name === 'AuthError') {
      return Response.json({ error: 'Please sign in again to continue.' }, { status: err.statusCode || 401 });
    }
    return Response.json({ error: err.message || SCAN_FAILED }, { status: 422 });
  }
}
