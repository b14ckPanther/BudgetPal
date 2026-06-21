/**
 * Client export download and share.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetchText } from '@/lib/apiFetch';

async function saveAndShare(content: string, filename: string, mimeType: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
}

export async function exportTransactionsCsv(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const csv = await apiFetchText('/api/export/transactions');
  await saveAndShare(csv, `budgetpal-transactions-${date}.csv`, 'text/csv');
}

export async function exportAccountJson(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const json = await apiFetchText('/api/export/account');
  const body = json;
  await saveAndShare(body, `budgetpal-account-export-${date}.json`, 'application/json');
}
