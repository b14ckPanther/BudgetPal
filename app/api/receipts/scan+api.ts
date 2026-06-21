import { ExpoRequest } from 'expo-router/server';
import { authenticateRequest } from '../../../src/server/auth';
import { processReceiptScan } from '../../../src/server/receipts/processReceiptScan';
import {
  ReceiptUploadError,
  validateImageBlob,
  blobToBuffer,
} from '../../../src/server/receipts/validateImageUpload';
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

    const imageField = formData.get('image') as Blob | string | null;
    if (!imageField || typeof imageField === 'string') {
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    let mimeType: string;
    try {
      const validated = validateImageBlob(imageField);
      mimeType = validated.mimeType;
    } catch (err) {
      if (err instanceof ReceiptUploadError) {
        return apiErrorResponse('INVALID_INPUT', err.statusCode);
      }
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    let buffer: Buffer;
    try {
      buffer = await blobToBuffer(imageField);
    } catch (err) {
      if (err instanceof ReceiptUploadError) {
        return apiErrorResponse('INVALID_INPUT', err.statusCode);
      }
      return apiErrorResponse('INVALID_INPUT', 400);
    }

    const result = await processReceiptScan(supabase, userId, buffer, mimeType);
    return Response.json(result);
  } catch (error: unknown) {
    return handleApiRouteError('receipts-scan', error);
  }
}
