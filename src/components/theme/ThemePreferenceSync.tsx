/**
 * Syncs theme preference from profile on login only.
 */

import { useEffect, useRef } from 'react';
import { useTheme } from '@/theme';
import { useCurrentProfile } from '@/hooks/useBudgetQueries';
import { ThemePreference } from '@/theme/colors';

export function ThemePreferenceSync() {
  const { data: profile } = useCurrentProfile();
  const { setPreference } = useTheme();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.id || !profile.themePreference) return;
    if (syncedUserId.current === profile.id) return;
    syncedUserId.current = profile.id;
    setPreference(profile.themePreference as ThemePreference);
  }, [profile?.id, profile?.themePreference, setPreference]);

  return null;
}
