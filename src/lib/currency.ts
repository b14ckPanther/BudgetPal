/**
 * BudgetPal — Currency Formatting Helper
 */

import { getAppIntlLocale } from './formatLocale';

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
};

const DEFAULT_CURRENCY = 'ILS';

/**
 * Format a number as a currency string.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: { showDecimals?: boolean }
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const showDecimals = options?.showDecimals ?? (amount % 1 !== 0);

  const formatted = showDecimals
    ? amount.toLocaleString(getAppIntlLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString(getAppIntlLocale(), { maximumFractionDigits: 0 });

  return `${symbol}${formatted}`;
}

/**
 * Get the currency symbol for a given code.
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format amount with sign for income (+) or expense (-).
 */
export function formatSignedCurrency(
  amount: number,
  type: 'income' | 'expense',
  currency: string = DEFAULT_CURRENCY
): string {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}
