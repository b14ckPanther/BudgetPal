/**
 * BudgetPal — Theme Provider with dark/light preference and locale-aware typography.
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
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocale } from '@/components/locale/LocaleProvider';
import { hideSplashScreen, preventSplashAutoHide } from '@/lib/splashScreen';
import { getTypographyForLocale } from './typography';
import { ALL_FONT_MAP } from './fonts';
import { spacing } from './spacing';
import { radius } from './radius';
import { ColorPalette, ThemePreference, getColorsForPreference } from './colors';
import type { TypographyTokens } from './typography';

preventSplashAutoHide();

const THEME_STORAGE_KEY = 'budgetpal.theme_preference';

export interface Theme {
  colors: ColorPalette;
  typography: TypographyTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<Theme | null>(null);

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialPreference?: ThemePreference;
}

export function ThemeProvider({ children, initialPreference = 'dark' }: ThemeProviderProps) {
  const { locale, ready: localeReady } = useLocale();
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [hydrated, setHydrated] = useState(false);

  const [fontsLoaded] = useFonts(ALL_FONT_MAP);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark') {
          setPreferenceState(stored);
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated && localeReady) {
      void hideSplashScreen();
    }
  }, [fontsLoaded, hydrated, localeReady]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const typography = useMemo(() => getTypographyForLocale(locale), [locale]);

  const value = useMemo<Theme>(
    () => ({
      colors: getColorsForPreference(preference),
      typography,
      spacing,
      radius,
      preference,
      setPreference,
    }),
    [preference, setPreference, typography]
  );

  if (!fontsLoaded || !hydrated || !localeReady) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export async function persistThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
}
