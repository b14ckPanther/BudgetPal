/**
 * BudgetPal — Internationalization Helper
 * Simple t() function that reads from centralized locale files.
 * Ready for future multi-language support.
 */

import en from '../locales/en.json';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

const currentLocale = 'en';

const locales: Record<string, Record<string, unknown>> = {
  en: en as unknown as Record<string, unknown>,
};

/**
 * Get a translated string by dot-notation key.
 * Example: t('agent.prompt') => "What should we handle today?"
 */
export function t(key: string): string {
  const locale = locales[currentLocale];
  if (!locale) return key;

  const parts = key.split('.');
  let result: unknown = locale;

  for (const part of parts) {
    if (result && typeof result === 'object' && part in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

/**
 * Get the current locale code.
 */
export function getCurrentLocale(): string {
  return currentLocale;
}

/**
 * Get time-based greeting key based on current hour.
 */
export function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'agent.greetingMorning';
  if (hour < 17) return 'agent.greetingAfternoon';
  return 'agent.greetingEvening';
}
