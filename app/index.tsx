/**
 * Race-safe bootstrap — resolves session, locale, and onboarding before navigation.
 */

import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { resolveAuthDestination, AuthDestination } from '@/lib/authRouting';
import { resetSessionRecoveryGuard } from '@/lib/sessionRecovery';
import { syncLocaleFromProfile } from '@/components/locale';
import { useTheme } from '@/theme';
import { Screen } from '@/components/ui';
import { ScreenLoadingState, ScreenErrorState } from '@/components/feedback';
import { t } from '@/lib/i18n';

type BootstrapPhase = 'loading' | 'ready' | 'error';

export default function Index() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<BootstrapPhase>('loading');
  const [destination, setDestination] = useState<AuthDestination>('login');

  const resolve = async () => {
    setPhase('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await resolveAuthDestination(session);
      if (result.profile?.preferredLanguage) {
        await syncLocaleFromProfile(result.profile.preferredLanguage);
      }
      setDestination(result.destination);
      setPhase('ready');
    } catch {
      setDestination('profile_error');
      setPhase('error');
    }
  };

  useEffect(() => {
    let active = true;

    const boot = async () => {
      await resolve();
    };

    void boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        resetSessionRecoveryGuard();
        setDestination('login');
        setPhase('ready');
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void resolve();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (phase === 'loading') {
    return (
      <Screen edges={['top', 'bottom']} style={{ backgroundColor: colors.background }}>
        <ScreenLoadingState message={t('states.bootstrapLoading')} />
      </Screen>
    );
  }

  if (phase === 'error' || destination === 'profile_error') {
    return (
      <Screen edges={['top', 'bottom']} style={{ backgroundColor: colors.background }}>
        <ScreenErrorState
          title={t('states.profileLoadFailedTitle')}
          message={t('states.profileLoadFailedMessage')}
          onRetry={() => void resolve()}
        />
      </Screen>
    );
  }

  if (destination === 'login') {
    return <Redirect href="/(auth)/login" />;
  }

  if (destination === 'onboarding') {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)/agent" />;
}
