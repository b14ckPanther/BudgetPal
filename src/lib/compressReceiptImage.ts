/**
 * Compress receipt images before upload.
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_EDGE = 2048;

export async function compressReceiptImage(
  uri: string,
  width?: number | null,
  height?: number | null
): Promise<{ uri: string; mimeType: string }> {
  const actions = [];
  const w = width ?? 0;
  const h = height ?? 0;

  if (w > MAX_EDGE || h > MAX_EDGE) {
    if (w >= h) {
      actions.push({ resize: { width: MAX_EDGE } });
    } else {
      actions.push({ resize: { height: MAX_EDGE } });
    }
  }

  const result = await manipulateAsync(uri, actions, {
    compress: 0.82,
    format: SaveFormat.JPEG,
  });

  return { uri: result.uri, mimeType: 'image/jpeg' };
}
