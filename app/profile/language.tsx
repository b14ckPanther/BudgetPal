/**
 * Language settings — English-only v1.
 */

import React from 'react';
import { View } from 'react-native';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { SettingsOptionRow } from '@/components/profile/SettingsOptionRow';
import { Text } from '@/components/ui';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';

export default function LanguageSettingsScreen() {
  const { colors, spacing } = useTheme();

  return (
    <ProfileSettingsLayout
      title={t('profile.language')}
      subtitle={t('profileSettings.languageSubtitle')}
    >
      <SettingsOptionRow
        label={t('profileSettings.languageEnglish')}
        description={t('profileSettings.languageEnglishDesc')}
        selected
        onPress={() => undefined}
      />
      <View style={{ marginTop: spacing.lg }}>
        <Text variant="bodySmall" color={colors.textMuted}>
          {t('profileSettings.languageFutureNote')}
        </Text>
      </View>
    </ProfileSettingsLayout>
  );
}
