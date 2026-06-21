/**
 * Budget Style settings — Strict, Balanced, Chill.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSettingsLayout } from '@/components/profile/ProfileSettingsLayout';
import { SettingsOptionRow } from '@/components/profile/SettingsOptionRow';
import { useFeedback } from '@/components/feedback';
import { t } from '@/lib/i18n';
import { BudgetStyle } from '@/types/api';
import { useCurrentProfile, useCurrentBudget, queryKeys } from '@/hooks/useBudgetQueries';
import { updateProfile } from '@/services/profile';
import { updateCurrentBudget } from '@/services/budgets';
import { getUserFacingMessage } from '@/lib/apiErrors';

const STYLES: BudgetStyle[] = ['strict', 'balanced', 'chill'];

export default function BudgetStyleSettingsScreen() {
  const { toast } = useFeedback();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: budget } = useCurrentBudget();
  const [saving, setSaving] = useState(false);

  const current = budget?.budgetStyle || profile?.budgetStyle || 'balanced';

  const handleSelect = async (style: BudgetStyle) => {
    if (saving || style === current) return;
    setSaving(true);
    try {
      await updateProfile({ budgetStyle: style });
      await updateCurrentBudget({ budgetStyle: style });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget });
      toast({ variant: 'success', message: t('profileSettings.budgetStyleUpdated') });
    } catch (err) {
      toast({ variant: 'error', message: getUserFacingMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSettingsLayout
      title={t('profile.budgetStyle')}
      subtitle={t('profileSettings.budgetStyleSubtitle')}
    >
      {STYLES.map((style) => (
        <SettingsOptionRow
          key={style}
          label={t(`onboarding.${style}`)}
          description={t(`onboarding.${style}Desc`)}
          selected={current === style}
          onPress={() => void handleSelect(style)}
          disabled={saving}
        />
      ))}
    </ProfileSettingsLayout>
  );
}
