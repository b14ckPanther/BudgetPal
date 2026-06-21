/**
 * Appearance settings — Dark and Light themes.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { SettingsOptionRow } from '@/components/profile/SettingsOptionRow';
import { useFeedback } from '@/components/feedback';
import { useTheme } from '@/theme';
import { ThemePreference } from '@/theme/colors';
import { t } from '@/lib/i18n';
import { useCurrentProfile, queryKeys } from '@/hooks/useBudgetQueries';
import { updateProfile } from '@/services/profile';
import { getUserFacingMessage } from '@/lib/apiErrors';

const OPTIONS: ThemePreference[] = ['dark', 'light'];

export default function AppearanceSettingsScreen() {
  const { preference, setPreference } = useTheme();
  const { toast } = useFeedback();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const [saving, setSaving] = useState(false);

  const current = profile?.themePreference || preference;

  const handleSelect = async (next: ThemePreference) => {
    if (saving || next === current) return;
    setSaving(true);
    setPreference(next);
    try {
      await updateProfile({ themePreference: next });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast({ variant: 'success', message: t('profileSettings.appearanceUpdated') });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.appearance')}
      subtitle={t('profileSettings.appearanceSubtitle')}
    >
      {OPTIONS.map((option) => (
        <SettingsOptionRow
          key={option}
          label={t(`profileSettings.appearance${option === 'dark' ? 'Dark' : 'Light'}`)}
          description={t(`profileSettings.appearance${option === 'dark' ? 'Dark' : 'Light'}Desc`)}
          selected={current === option}
          onPress={() => void handleSelect(option)}
          disabled={saving}
        />
      ))}
    </ProfileSettingsLayout>
  );
}
