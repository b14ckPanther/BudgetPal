/**
 * Currency settings — safe early-stage currency changes only.
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { SettingsOptionRow } from '@/components/profile/SettingsOptionRow';
import { Text } from '@/components/ui';
import { useFeedback } from '@/components/feedback';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { canChangeBudgetCurrency } from '@/lib/currencyIntegrity';
import { useCurrentProfile, useCurrentBudget, queryKeys } from '@/hooks/useBudgetQueries';
import { updateProfile } from '@/services/profile';
import { updateCurrentBudget } from '@/services/budgets';
import { getUserFacingMessage } from '@/lib/apiErrors';
import { supabase } from '@/lib/supabase';

export default function CurrencySettingsScreen() {
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: budget } = useCurrentBudget();
  const [canChange, setCanChange] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const currentCode = budget?.currency || profile?.currency || 'ILS';

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const check = await canChangeBudgetCurrency(user.id);
      if (active) setCanChange(check.allowed);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = async (code: string) => {
    if (saving || code === currentCode) return;
    if (canChange === false) {
      toast({ variant: 'warning', message: t('profileSettings.currencyChangeBlocked') });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ currency: code });
      await updateCurrentBudget({ currency: code });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
      toast({ variant: 'success', message: t('profileSettings.currencyUpdated') });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.currency')}
      subtitle={t('profileSettings.currencySubtitle')}
    >
      {canChange === false && (
        <View
          style={{
            backgroundColor: colors.warningSoft,
            borderRadius: 12,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text variant="bodySmall" color={colors.warning}>
            {t('profileSettings.currencyChangeBlocked')}
          </Text>
        </View>
      )}

      {SUPPORTED_CURRENCIES.map((currency) => (
        <SettingsOptionRow
          key={currency.code}
          label={`${t(currency.nameKey)} (${currency.code}) ${currency.symbol}`}
          selected={currentCode === currency.code}
          onPress={() => void handleSelect(currency.code)}
          disabled={saving || canChange === false}
        />
      ))}
    </ProfileSettingsLayout>
  );
}
