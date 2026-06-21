/**
 * Locale-aware formatting helpers.
 */

import { getI18nLocale, t } from './i18n';
import { getIntlLocale } from './locale';

export function getAppIntlLocale(): string {
  return getIntlLocale(getI18nLocale());
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(getAppIntlLocale(), options);
}

export function formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(getAppIntlLocale(), {
    style: 'percent',
    maximumFractionDigits: 0,
    ...options,
  });
}
