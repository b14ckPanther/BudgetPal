/**
 * App locale, direction, and persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

export type AppLocale = 'en' | 'he';

export const LOCALE_STORAGE_KEY = 'budgetpal.app_locale';
export const DEFAULT_LOCALE: AppLocale = 'en';

export function isRtlLocale(locale: AppLocale): boolean {
  return locale === 'he';
}

export function getIntlLocale(locale: AppLocale): string {
  return locale === 'he' ? 'he-IL' : 'en-US';
}

export function localeNeedsRtlChange(locale: AppLocale): boolean {
  const shouldBeRtl = isRtlLocale(locale);
  return I18nManager.isRTL !== shouldBeRtl;
}

export async function readCachedLocale(): Promise<AppLocale> {
  const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'he' || stored === 'en') return stored;
  return DEFAULT_LOCALE;
}

export async function persistLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function applyRtlForLocale(locale: AppLocale): void {
  const shouldBeRtl = isRtlLocale(locale);
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.forceRTL(shouldBeRtl);
  }
}
