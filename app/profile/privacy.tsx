/**
 * Privacy center — truthful data practices and actions.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { Text, Button, Card } from '@/components/ui';
import { useFeedback } from '@/components/feedback';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { clearAgentHistory } from '@/services/agent';
import { openDeviceSettings } from '@/services/notifications/budgetAlerts';
import { getUserFacingMessage } from '@/lib/apiErrors';
import { ApiRequestError } from '@/lib/apiFetch';
import { supabase } from '@/lib/supabase';

export default function PrivacyScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { confirm, toast } = useFeedback();
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pending } = await supabase
      .from('agent_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'proposed')
      .limit(1);

    if (pending && pending.length > 0) {
      toast({ variant: 'warning', message: t('agent.clearHistoryBlocked') });
      return;
    }

    const confirmed = await confirm({
      title: t('agent.clearHistoryTitle'),
      message: t('profileSettings.privacyClearHistoryNote'),
      variant: 'destructive',
      confirmLabel: t('agent.clearHistoryConfirm'),
    });
    if (!confirmed) return;

    setClearing(true);
    try {
      await clearAgentHistory();
      toast({ variant: 'success', message: t('feedback.historyCleared') });
    } catch (err) {
      if (err instanceof ApiRequestError && err.parsed.code === 'CLEAR_HISTORY_PENDING') {
        toast({ variant: 'warning', message: t('agent.clearHistoryBlocked') });
        return;
      }
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setClearing(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.privacy')}
      subtitle={t('profileSettings.privacySubtitle')}
    >
      <Card variant="glass" style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
        <Text variant="bodySmall" color={colors.textSecondary}>
          {t('profileSettings.privacyStorageBody')}
        </Text>
      </Card>

      <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
        {t('profileSettings.privacyActions')}
      </Text>

      <Button
        label={t('profile.dataExport')}
        variant="secondary"
        onPress={() => router.push('/profile/data-export')}
        style={{ marginBottom: spacing.sm }}
      />
      <Button
        label={t('agent.clearHistory')}
        variant="secondary"
        onPress={() => void handleClearHistory()}
        loading={clearing}
        style={{ marginBottom: spacing.sm }}
      />
      <Button
        label={t('profileSettings.openDeviceSettings')}
        variant="ghost"
        onPress={() => void openDeviceSettings()}
      />
    </ProfileSettingsLayout>
  );
}
