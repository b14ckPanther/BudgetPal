/**
 * Bundled font families per app locale.
 */

import {
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
} from '@expo-google-fonts/ubuntu';
import {
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
} from '@expo-google-fonts/heebo';
import { AppLocale } from '@/lib/locale';

export const UBUNTU_FONT_MAP = {
  'Ubuntu-Regular': Ubuntu_400Regular,
  'Ubuntu-Medium': Ubuntu_500Medium,
  'Ubuntu-Bold': Ubuntu_700Bold,
} as const;

export const HEEBO_FONT_MAP = {
  'Heebo-Regular': Heebo_400Regular,
  'Heebo-Medium': Heebo_500Medium,
  'Heebo-SemiBold': Heebo_600SemiBold,
  'Heebo-Bold': Heebo_700Bold,
} as const;

export const ALL_FONT_MAP = {
  ...UBUNTU_FONT_MAP,
  ...HEEBO_FONT_MAP,
};

export interface LocaleFontFamilies {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
}

export function getFontFamiliesForLocale(locale: AppLocale): LocaleFontFamilies {
  if (locale === 'he') {
    return {
      regular: 'Heebo-Regular',
      medium: 'Heebo-Medium',
      semibold: 'Heebo-SemiBold',
      bold: 'Heebo-Bold',
    };
  }
  return {
    regular: 'Ubuntu-Regular',
    medium: 'Ubuntu-Medium',
    semibold: 'Ubuntu-Bold',
    bold: 'Ubuntu-Bold',
  };
}
