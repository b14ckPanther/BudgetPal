/**
 * BudgetPal — Theme Provider with dark/light preference.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { ColorPalette, ThemePreference, getColorsForPreference } from './colors';

SplashScreen.preventAutoHideAsync();

const THEME_STORAGE_KEY = 'budgetpal.theme_preference';

export interface Theme {
  colors: ColorPalette;
  typography: typeof typography;
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
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [hydrated, setHydrated] = useState(false);

  const [fontsLoaded] = useFonts({
    'Ubuntu-Regular': require('../../assets/fonts/Ubuntu-Regular.ttf'),
    'Ubuntu-Medium': require('../../assets/fonts/Ubuntu-Medium.ttf'),
    'Ubuntu-Bold': require('../../assets/fonts/Ubuntu-Bold.ttf'),
  });

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
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const value = useMemo<Theme>(
    () => ({
      colors: getColorsForPreference(preference),
      typography,
      spacing,
      radius,
      preference,
      setPreference,
    }),
    [preference, setPreference]
  );

  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export async function persistThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
}
