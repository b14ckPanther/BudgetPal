/**
 * Syncs locale preference from profile on login.
 */

import { useEffect, useRef } from 'react';
import { useCurrentProfile } from '@/hooks/useBudgetQueries';
import { useLocale } from './LocaleProvider';
import { AppLocale } from '@/lib/locale';
import { resetSpeechVoiceCache } from '@/services/agentSpeech';

export function LocalePreferenceSync() {
  const { data: profile } = useCurrentProfile();
  const { locale, setLocale } = useLocale();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    const profileLocale: AppLocale = profile.preferredLanguage === 'he' ? 'he' : 'en';
    if (syncedUserId.current === profile.id && locale === profileLocale) return;
    syncedUserId.current = profile.id;
    if (locale !== profileLocale) {
      resetSpeechVoiceCache();
      void setLocale(profileLocale, { skipProfileSync: true });
    }
  }, [profile?.id, profile?.preferredLanguage, locale, setLocale]);

  return null;
}
