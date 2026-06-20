/**
 * BudgetPal — Theme Provider
 * Wraps the app with theme context and loads Ubuntu fonts.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';

SplashScreen.preventAutoHideAsync();

export interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
}

const theme: Theme = {
  colors,
  typography,
  spacing,
  radius,
};

const ThemeContext = createContext<Theme>(theme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [fontsLoaded] = useFonts({
    'Ubuntu-Regular': require('../../assets/fonts/Ubuntu-Regular.ttf'),
    'Ubuntu-Medium': require('../../assets/fonts/Ubuntu-Medium.ttf'),
    'Ubuntu-Bold': require('../../assets/fonts/Ubuntu-Bold.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
