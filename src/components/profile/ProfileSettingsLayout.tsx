/**
 * Shared layout for profile settings sub-screens.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useIsRtl } from '@/components/locale/LocaleProvider';
import { Screen, Text } from '@/components/ui';
import { t } from '@/lib/i18n';

interface ProfileSettingsLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ProfileSettingsLayout({ title, subtitle, children }: ProfileSettingsLayoutProps) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();

  return (
    <Screen edges={['bottom']}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.borderSoft,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft
            size={20}
            color={colors.primary}
            style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined}
          />
          <Text variant="bodySmall" color={colors.primary} weight="medium" style={{ marginStart: 4 }}>
            {t('common.back')}
          </Text>
        </Pressable>
        <Text variant="h2" style={{ marginTop: spacing.md }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    alignSelf: 'flex-start',
  },
});
