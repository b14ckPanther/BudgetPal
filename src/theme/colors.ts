/**
 * BudgetPal — Theme color palettes.
 */

import { darkColors } from './colors.dark';
import { lightColors } from './colors.light';

export type ThemePreference = 'dark' | 'light';

export interface ColorPalette {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderSoft: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryGlow: string;
  ai: string;
  aiSoft: string;
  aiGlow: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  risk: string;
  riskSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
  heroGradientStart: string;
  heroGradientMiddle: string;
  heroGradientEnd: string;
  white05: string;
  white10: string;
  white15: string;
  black40: string;
  statusBarStyle: 'light' | 'dark';
}

export const colors: ColorPalette = darkColors;

export function getColorsForPreference(preference: ThemePreference): ColorPalette {
  return preference === 'light' ? lightColors : darkColors;
}

export type ColorToken = keyof ColorPalette;
