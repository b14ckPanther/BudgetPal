/**
 * Locale context — language, direction, typography sync, RTL restart.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AppLocale,
  DEFAULT_LOCALE,
  applyRtlForLocale,
  isRtlLocale,
  localeNeedsRtlChange,
  persistLocale,
  readCachedLocale,
} from '@/lib/locale';
import { reloadApp } from '@/lib/reloadApp';
import { setI18nLocale } from '@/lib/i18n';
import { updateProfile } from '@/services/profile';
import { supabase } from '@/lib/supabase';

interface LocaleContextValue {
  locale: AppLocale;
  isRtl: boolean;
  ready: boolean;
  needsRestart: boolean;
  setLocale: (next: AppLocale, options?: { skipProfileSync?: boolean }) => Promise<void>;
  applyRestart: () => Promise<void>;
  dismissRestartPrompt: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function useIsRtl(): boolean {
  return useLocale().isRtl;
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await readCachedLocale();
      if (!active) return;
      applyRtlForLocale(cached);
      setI18nLocale(cached);
      setLocaleState(cached);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback(
    async (next: AppLocale, options?: { skipProfileSync?: boolean }) => {
      setI18nLocale(next);
      setLocaleState(next);
      await persistLocale(next);

      if (!options?.skipProfileSync) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await updateProfile({ preferredLanguage: next });
          }
        } catch {
          // Profile sync can complete on next session.
        }
      }

      if (localeNeedsRtlChange(next)) {
        applyRtlForLocale(next);
        setNeedsRestart(true);
      }
    },
    []
  );

  const applyRestart = useCallback(async () => {
    await reloadApp();
  }, []);

  const dismissRestartPrompt = useCallback(() => {
    setNeedsRestart(false);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRtl: isRtlLocale(locale),
      ready,
      needsRestart,
      setLocale,
      applyRestart,
      dismissRestartPrompt,
    }),
    [locale, ready, needsRestart, setLocale, applyRestart, dismissRestartPrompt]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export async function syncLocaleFromProfile(preferredLanguage?: string | null): Promise<AppLocale> {
  const next: AppLocale = preferredLanguage === 'he' ? 'he' : 'en';
  setI18nLocale(next);
  await persistLocale(next);
  if (localeNeedsRtlChange(next)) {
    applyRtlForLocale(next);
  }
  return next;
}
