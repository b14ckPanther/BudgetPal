/**
 * Receipt scan flow: permissions, capture, compress, upload.
 */

import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { compressReceiptImage } from '@/lib/compressReceiptImage';
import { scanReceiptImage } from '@/services/receipts/scanReceipt';
import { AgentResponse } from '@/types/agent';
import { t } from '@/lib/i18n';

export type ReceiptScanUiState =
  | 'idle'
  | 'selecting'
  | 'preview'
  | 'scanning'
  | 'scan_failed';

export interface ReceiptPreviewAsset {
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export function useReceiptScan(onComplete: (response: AgentResponse) => void) {
  const [uiState, setUiState] = useState<ReceiptScanUiState>('idle');
  const [preview, setPreview] = useState<ReceiptPreviewAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = useCallback(() => {
    setErrorMessage(null);
    setPreview(null);
    setUiState('selecting');
  }, []);

  const close = useCallback(() => {
    setUiState('idle');
    setPreview(null);
    setErrorMessage(null);
  }, []);

  const handlePermissionDenied = useCallback((kind: 'camera' | 'library') => {
    setErrorMessage(
      kind === 'camera' ? t('receipt.permissionDeniedCamera') : t('receipt.permissionDeniedLibrary')
    );
    setUiState('scan_failed');
  }, []);

  const pickFromCamera = useCallback(async () => {
    setErrorMessage(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      handlePermissionDenied('camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      setUiState('selecting');
      return;
    }

    const asset = result.assets[0];
    setPreview({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      width: asset.width,
      height: asset.height,
    });
    setUiState('preview');
  }, [handlePermissionDenied]);

  const pickFromLibrary = useCallback(async () => {
    setErrorMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      handlePermissionDenied('library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      setUiState('selecting');
      return;
    }

    const asset = result.assets[0];
    setPreview({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      width: asset.width,
      height: asset.height,
    });
    setUiState('preview');
  }, [handlePermissionDenied]);

  const submitScan = useCallback(async () => {
    if (!preview) return;
    setUiState('scanning');
    setErrorMessage(null);

    try {
      const compressed = await compressReceiptImage(preview.uri, preview.width, preview.height);
      const response = await scanReceiptImage(compressed.uri, compressed.mimeType);
      onComplete(response);
      close();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('receipt.scanErrorGeneric');
      setErrorMessage(message);
      setUiState('scan_failed');
    }
  }, [preview, onComplete, close]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    if (preview) {
      setUiState('preview');
    } else {
      setUiState('selecting');
    }
  }, [preview]);

  return {
    uiState,
    preview,
    errorMessage,
    open,
    close,
    pickFromCamera,
    pickFromLibrary,
    submitScan,
    retry,
    setUiState,
  };
}
