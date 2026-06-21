/**
 * BudgetPal — Internationalization with English and Hebrew.
 */

import en from '../locales/en.json';
import he from '../locales/he.json';
import { AppLocale, DEFAULT_LOCALE } from './locale';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

const catalogs: Record<AppLocale, Record<string, unknown>> = {
  en: en as unknown as Record<string, unknown>,
  he: he as unknown as Record<string, unknown>,
};

let activeLocale: AppLocale = DEFAULT_LOCALE;
let missingKeyHandler: ((key: string, locale: AppLocale) => void) | null = null;

export function setI18nLocale(locale: AppLocale): void {
  activeLocale = locale;
}

export function getI18nLocale(): AppLocale {
  return activeLocale;
}

export function registerMissingKeyHandler(
  handler: ((key: string, locale: AppLocale) => void) | null
): void {
  missingKeyHandler = handler;
}

function resolveKey(locale: AppLocale, key: string): string | null {
  const parts = key.split('.');
  let result: unknown = catalogs[locale];

  for (const part of parts) {
    if (result && typeof result === 'object' && part in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return typeof result === 'string' ? result : null;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let translated = resolveKey(activeLocale, key);

  if (!translated) {
    if (activeLocale === 'he') {
      if (__DEV__) {
        missingKeyHandler?.(key, activeLocale);
        console.warn(`[i18n] Missing Hebrew key: ${key}`);
      }
      return `[${key}]`;
    }
    return key;
  }

  if (!params) return translated;

  return Object.entries(params).reduce(
    (text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value)),
    translated
  );
}

export function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'agent.greetingMorning';
  if (hour < 17) return 'agent.greetingAfternoon';
  return 'agent.greetingEvening';
}

export function getCurrentLocale(): AppLocale {
  return activeLocale;
}
