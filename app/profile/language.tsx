/**
 * Language settings — English and Hebrew.
 */

import React from 'react';
import { View } from 'react-native';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { SettingsOptionRow } from '@/components/profile/SettingsOptionRow';
import { Text } from '@/components/ui';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { useLocale } from '@/components/locale';
import { AppLocale } from '@/lib/locale';

export default function LanguageSettingsScreen() {
  const { colors, spacing } = useTheme();
  const { locale, setLocale } = useLocale();

  const select = (next: AppLocale) => {
    if (next !== locale) {
      void setLocale(next);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.language')}
      subtitle={t('profileSettings.languageSubtitle')}
    >
      <SettingsOptionRow
        label={t('profileSettings.languageEnglish')}
        description={t('profileSettings.languageEnglishDesc')}
        selected={locale === 'en'}
        onPress={() => select('en')}
      />
      <SettingsOptionRow
        label={t('profileSettings.languageHebrew')}
        description={t('profileSettings.languageHebrewDesc')}
        selected={locale === 'he'}
        onPress={() => select('he')}
      />
      <View style={{ marginTop: spacing.lg }}>
        <Text variant="bodySmall" color={colors.textMuted}>
          {t('profileSettings.languageNote')}
        </Text>
      </View>
    </ProfileSettingsLayout>
  );
}
