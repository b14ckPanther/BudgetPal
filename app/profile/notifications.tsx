/**
 * Notifications settings — local budget alerts only.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { Text, Button, Card } from '@/components/ui';
import { useFeedback } from '@/components/feedback';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { useCurrentProfile, queryKeys } from '@/hooks/useBudgetQueries';
import { updateProfile } from '@/services/profile';
import { getUserFacingMessage } from '@/lib/apiErrors';
import {
  configureNotificationChannel,
  getNotificationPermissionStatus,
  openDeviceSettings,
  requestNotificationPermission,
} from '@/services/notifications/budgetAlerts';
import { Switch } from 'react-native';

export default function NotificationsSettingsScreen() {
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [saving, setSaving] = useState(false);

  const refreshPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermission(status);
  }, []);

  useEffect(() => {
    void configureNotificationChannel();
    void refreshPermission();
  }, [refreshPermission]);

  const enabled = profile?.notificationsEnabled !== false;

  const handleToggle = async (next: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (next) {
        const granted = await requestNotificationPermission();
        await refreshPermission();
        if (!granted) {
          await updateProfile({ notificationsEnabled: false });
          await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
          toast({ variant: 'warning', message: t('profileSettings.notificationsDenied') });
          return;
        }
      }
      await updateProfile({ notificationsEnabled: next });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast({
        variant: 'success',
        message: next
          ? t('profileSettings.notificationsEnabled')
          : t('profileSettings.notificationsDisabled'),
      });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.notifications')}
      subtitle={t('profileSettings.notificationsSubtitle')}
    >
      <Card variant="default" style={{ marginBottom: spacing.lg }}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="bodySmall" weight="medium">
              {t('profileSettings.budgetAlertsToggle')}
            </Text>
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
              {t('profileSettings.budgetAlertsDesc')}
            </Text>
          </View>
          <Switch
            value={enabled && permission === 'granted'}
            onValueChange={(v) => void handleToggle(v)}
            disabled={saving}
            trackColor={{ false: colors.borderSoft, true: colors.primarySoft }}
            thumbColor={enabled && permission === 'granted' ? colors.primary : colors.surface}
            accessibilityLabel={t('profileSettings.budgetAlertsToggle')}
          />
        </View>
      </Card>

      <Text variant="bodySmall" color={colors.textMuted}>
        {t('profileSettings.notificationsLimitation')}
      </Text>

      {permission === 'denied' && (
        <Button
          label={t('profileSettings.openDeviceSettings')}
          variant="secondary"
          onPress={() => void openDeviceSettings()}
          style={{ marginTop: spacing.xl }}
        />
      )}
    </ProfileSettingsLayout>
  );
}

const styles = {
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minHeight: 44,
  },
};
