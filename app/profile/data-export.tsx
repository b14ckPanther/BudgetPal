/**
 * Data Export screen.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { Text, Button, Card } from '@/components/ui';
import { useFeedback } from '@/components/feedback';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { exportAccountJson, exportTransactionsCsv } from '@/services/export';
import { getUserFacingMessage } from '@/lib/apiErrors';

export default function DataExportScreen() {
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  const handleCsv = async () => {
    if (exportingCsv) return;
    setExportingCsv(true);
    try {
      await exportTransactionsCsv();
      toast({ variant: 'success', message: t('profileSettings.exportCsvSuccess') });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleJson = async () => {
    if (exportingJson) return;
    setExportingJson(true);
    try {
      await exportAccountJson();
      toast({ variant: 'success', message: t('profileSettings.exportJsonSuccess') });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setExportingJson(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.dataExport')}
      subtitle={t('profileSettings.dataExportSubtitle')}
    >
      <Text variant="bodySmall" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
        {t('profileSettings.dataExportReviewNote')}
      </Text>

      <Card variant="default" style={{ marginBottom: spacing.md, padding: spacing.lg }}>
        <Text variant="label">{t('profileSettings.exportCsvTitle')}</Text>
        <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          {t('profileSettings.exportCsvDesc')}
        </Text>
        <Button
          label={exportingCsv ? t('profileSettings.exporting') : t('profileSettings.exportCsvAction')}
          onPress={() => void handleCsv()}
          loading={exportingCsv}
        />
      </Card>

      <Card variant="default" style={{ padding: spacing.lg }}>
        <Text variant="label">{t('profileSettings.exportJsonTitle')}</Text>
        <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          {t('profileSettings.exportJsonDesc')}
        </Text>
        <Button
          label={exportingJson ? t('profileSettings.exporting') : t('profileSettings.exportJsonAction')}
          variant="secondary"
          onPress={() => void handleJson()}
          loading={exportingJson}
        />
      </Card>
    </ProfileSettingsLayout>
  );
}
