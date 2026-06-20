/**
 * BudgetPal — Profile Screen
 * User profile, preferences, settings, and logout.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Globe,
  Languages,
  Gauge,
  Bell,
  Download,
  Shield,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useCurrentProfile, useCurrentBudget } from '@/hooks/useBudgetQueries';

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

export default function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  // Queries
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, refetch: refetchProfile } = useCurrentProfile();
  const { data: budget, isLoading: isBudgetLoading, isError: isBudgetError, refetch: refetchBudget } = useCurrentBudget();

  const isLoading = isProfileLoading || isBudgetLoading;
  const isError = isProfileError || isBudgetError;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Logout Error', error.message);
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred during logout.');
    }
  };

  const onRefresh = () => {
    refetchProfile();
    refetchBudget();
  };

  if (isLoading) {
    return (
      <Screen backgroundVariant="hero">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
            Loading your profile preferences...
          </Text>
        </View>
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen backgroundVariant="hero">
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <AlertTriangle size={48} color={colors.danger} />
          <Text variant="h3" style={{ marginTop: spacing.md }} color={colors.textPrimary}>
            Unable to load profile
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
            Please pull down to refresh.
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  const displayName = profile.displayName || `${profile.firstName} ${profile.lastName}`.trim() || 'User';
  const email = profile.email || 'No email registered';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const currencyValue = budget?.currency 
    ? `${budget.currency} (${budget.currency === 'ILS' ? 'Shekel' : budget.currency === 'USD' ? 'Dollar' : budget.currency === 'EUR' ? 'Euro' : 'Pound'})`
    : 'ILS (Shekel)';

  const budgetStyleValue = profile.budgetStyle
    ? profile.budgetStyle.charAt(0).toUpperCase() + profile.budgetStyle.slice(1)
    : 'Balanced';

  const notificationsValue = profile.notificationsEnabled !== false ? 'Enabled' : 'Disabled';

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
                Active
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
        />
        <SettingRow
          icon={<Languages size={18} color={colors.textSecondary} />}
          label={t('profile.language')}
          value="English Only"
        />
        <SettingRow
          icon={<Gauge size={18} color={colors.textSecondary} />}
          label={t('profile.budgetStyle')}
          value={budgetStyleValue}
        />
        <SettingRow
          icon={<Bell size={18} color={colors.textSecondary} />}
          label={t('profile.notifications')}
          value={notificationsValue}
        />

        {/* ── Data & Privacy ───────────────────────── */}
        <Text variant="label" color={colors.textMuted} style={{ marginTop: spacing.xxl, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>
          Data & Privacy
        </Text>

        <SettingRow
          icon={<Download size={18} color={colors.textSecondary} />}
          label={t('profile.dataExport')}
          value=""
        />
        <SettingRow
          icon={<Shield size={18} color={colors.textSecondary} />}
          label={t('profile.privacy')}
          value=""
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
