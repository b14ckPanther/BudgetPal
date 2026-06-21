/**
 * Download report PDF to cache and open share sheet.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getReportDownloadUrl } from './api';

export async function downloadAndShareReport(reportId: string, title: string): Promise<void> {
  const { downloadUrl } = await getReportDownloadUrl(reportId);
  const safeName = title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || 'report';
  const localUri = `${FileSystem.cacheDirectory}budgetpal-${safeName}-${reportId.slice(0, 8)}.pdf`;

  const result = await FileSystem.downloadAsync(downloadUrl, localUri);
  if (result.status !== 200) {
    throw new Error('Could not download report PDF.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: title,
  });
}
