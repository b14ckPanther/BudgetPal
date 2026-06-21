/**
 * BudgetPal — Profile Screen
 * User profile, preferences, settings, and logout.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Languages,
  Gauge,
  Bell,
  Volume2,
  Download,
  Shield,
  LogOut,
  ChevronRight,
  SunMoon,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, Button } from '@/components/ui';
import { ScreenLoadingState, ScreenErrorState } from '@/components/feedback';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale';
import { supabase } from '@/lib/supabase';
import { useCurrentProfile, useCurrentBudget, queryKeys } from '@/hooks/useBudgetQueries';
import { updateProfile } from '@/services/profile';
import { useFeedback } from '@/components/feedback';
import { stopAgentSpeech } from '@/services/agentSpeech';
import { getCurrencyOption } from '@/lib/currencies';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

function SettingRow({ icon, label, value, onPress }: SettingRowProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="default" onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          {icon}
          <Text variant="bodySmall" weight="medium" style={{ marginLeft: spacing.md }}>
            {label}
          </Text>
        </View>
        <View style={styles.settingRight}>
          <Text variant="bodySmall" color={colors.textMuted}>
            {value}
          </Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </View>
    </Card>
  );
}

function SettingToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Card variant="default" style={{ marginBottom: spacing.sm }}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          {icon}
          <View style={{ marginLeft: spacing.md, flex: 1, paddingRight: spacing.sm }}>
            <Text variant="bodySmall" weight="medium">
              {label}
            </Text>
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.borderSoft, true: colors.primarySoft }}
          thumbColor={value ? colors.primary : colors.surface}
          accessibilityLabel={label}
        />
      </View>
    </Card>
  );
}

export default function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirm, toast } = useFeedback();
  const [voiceRepliesSaving, setVoiceRepliesSaving] = useState(false);

  // Queries
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, refetch: refetchProfile } = useCurrentProfile();
  const { data: budget, isLoading: isBudgetLoading, isError: isBudgetError, refetch: refetchBudget } = useCurrentBudget();

  const isLoading = isProfileLoading || isBudgetLoading;
  const isError = isProfileError || isBudgetError;

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: t('feedback.logoutTitle'),
      message: t('feedback.logoutMessage'),
      variant: 'destructive',
      confirmLabel: t('profile.logout'),
    });
    if (!confirmed) return;

    try {
      stopAgentSpeech();
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (__DEV__) console.error('Logout failed:', error);
        toast({ variant: 'error', message: t('feedback.logoutFailed') });
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: unknown) {
      if (__DEV__) console.error('Logout failed:', err);
      toast({ variant: 'error', message: t('feedback.logoutFailed') });
    }
  };

  const onRefresh = () => {
    refetchProfile();
    refetchBudget();
  };

  const handleVoiceRepliesToggle = async (next: boolean) => {
    if (voiceRepliesSaving) return;
    if (!next) {
      stopAgentSpeech();
    }
    setVoiceRepliesSaving(true);
    try {
      await updateProfile({ agentVoiceRepliesEnabled: next });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    } catch (err: unknown) {
      if (__DEV__) console.error('Voice replies toggle failed:', err);
      toast({ variant: 'error', message: t('feedback.settingsUpdateFailed') });
    } finally {
      setVoiceRepliesSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundVariant="hero">
        <ScreenLoadingState message={t('states.profileScreenLoading')} />
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen backgroundVariant="hero">
        <ScreenErrorState
          title={t('states.profileScreenLoadFailedTitle')}
          message={t('states.profileScreenLoadFailedMessage')}
          onRetry={onRefresh}
          onRefresh={onRefresh}
        />
      </Screen>
    );
  }

  const displayName = profile.displayName || `${profile.firstName} ${profile.lastName}`.trim() || 'User';
  const email = profile.email || 'No email registered';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const currencyCode = budget?.currency || profile?.currency || 'ILS';
  const currencyMeta = getCurrencyOption(currencyCode);
  const currencyValue = currencyMeta
    ? `${t(currencyMeta.nameKey)} (${currencyCode})`
    : currencyCode;

  const budgetStyleValue = profile.budgetStyle
    ? t(`onboarding.${profile.budgetStyle}`)
    : t('onboarding.balanced');

  const notificationsValue =
    profile.notificationsEnabled !== false
      ? t('profileSettings.statusEnabled')
      : t('profileSettings.statusDisabled');

  const appearanceValue =
    (profile.themePreference || 'dark') === 'light'
      ? t('profileSettings.appearanceLight')
      : t('profileSettings.appearanceDark');

  return (
    <Screen backgroundVariant="hero">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="h1" style={{ fontSize: 26, lineHeight: 32 }}>
                {t('profile.title')}
              </Text>
              <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
                {t('profile.subtitle')}
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: colors.primarySoft }]}>
              <Text variant="caption" color={colors.primary} weight="medium" style={{ fontSize: 11 }}>
                {t('profile.statusActive')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── User Info ────────────────────────────── */}
        <Card variant="elevated" style={{ marginTop: spacing.xl }}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primarySoft, borderColor: colors.primary },
              ]}
            >
              <Text variant="h2" color={colors.primary}>{avatarLetter}</Text>
            </View>
            <View style={{ marginLeft: spacing.lg }}>
              <Text variant="h3">{displayName}</Text>
              <Text variant="bodySmall" color={colors.textMuted}>{email}</Text>
            </View>
          </View>
        </Card>

        {/* ── Preferences ──────────────────────────── */}
        <Text variant="label" color={colors.textMuted} style={{ marginTop: spacing.xxl, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>
          {t('profile.preferences')}
        </Text>

        <SettingRow
          icon={<Globe size={18} color={colors.textSecondary} />}
          label={t('profile.currency')}
          value={currencyValue}
          onPress={() => router.push('/profile/currency')}
        />
        <SettingRow
          icon={<Languages size={18} color={colors.textSecondary} />}
          label={t('profile.language')}
          value={locale === 'he' ? t('profileSettings.languageHebrew') : t('profileSettings.languageEnglish')}
          onPress={() => router.push('/profile/language')}
        />
        <SettingRow
          icon={<Gauge size={18} color={colors.textSecondary} />}
          label={t('profile.budgetStyle')}
          value={budgetStyleValue}
          onPress={() => router.push('/profile/budget-style')}
        />
        <SettingRow
          icon={<Bell size={18} color={colors.textSecondary} />}
          label={t('profile.notifications')}
          value={notificationsValue}
          onPress={() => router.push('/profile/notifications')}
        />
        <SettingRow
          icon={<SunMoon size={18} color={colors.textSecondary} />}
          label={t('profile.appearance')}
          value={appearanceValue}
          onPress={() => router.push('/profile/appearance')}
        />
        <SettingToggleRow
          icon={<Volume2 size={18} color={colors.textSecondary} />}
          label={t('profile.agentVoiceReplies')}
          description={t('profile.agentVoiceRepliesDesc')}
          value={profile.agentVoiceRepliesEnabled === true}
          onValueChange={handleVoiceRepliesToggle}
          disabled={voiceRepliesSaving}
        />

        {/* ── Data & Privacy ───────────────────────── */}
        <Text variant="label" color={colors.textMuted} style={{ marginTop: spacing.xxl, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>
          {t('profile.dataAndPrivacy')}
        </Text>

        <SettingRow
          icon={<Download size={18} color={colors.textSecondary} />}
          label={t('profile.dataExport')}
          value={t('profileSettings.dataExportRowValue')}
          onPress={() => router.push('/profile/data-export')}
        />
        <SettingRow
          icon={<Shield size={18} color={colors.textSecondary} />}
          label={t('profile.privacy')}
          value={t('profileSettings.privacyRowValue')}
          onPress={() => router.push('/profile/privacy')}
        />

        {/* ── Logout ───────────────────────────────── */}
        <View style={{ marginTop: spacing.xxl }}>
          <Button
            label={t('profile.logout')}
            variant="danger"
            icon={<LogOut size={16} color={colors.danger} />}
            onPress={handleLogout}
          />
        </View>

        {/* ── Version ──────────────────────────────── */}
        <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xxl }}>
          {t('common.appName')} v1.0.0
        </Text>

        <View style={{ height: spacing.xxxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
