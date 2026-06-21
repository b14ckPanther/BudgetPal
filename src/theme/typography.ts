/**
 * Locale-aware typography tokens.
 */

import { AppLocale } from '@/lib/locale';
import { getFontFamiliesForLocale, LocaleFontFamilies } from './fonts';

const SHARED = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    display: 46,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
};

export interface TypographyTokens {
  fontFamily: LocaleFontFamilies;
  size: typeof SHARED.size;
  lineHeight: typeof SHARED.lineHeight;
  weight: typeof SHARED.weight;
}

export function getTypographyForLocale(locale: AppLocale): TypographyTokens {
  return {
    fontFamily: getFontFamiliesForLocale(locale),
    ...SHARED,
  };
}

/** @deprecated Use theme.typography from useTheme() */
export const typography = getTypographyForLocale('en');

export type FontFamily = keyof LocaleFontFamilies;
export type FontSize = keyof typeof SHARED.size;
