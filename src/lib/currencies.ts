/**
 * Supported budget currencies for v1.
 */

export interface CurrencyOption {
  code: string;
  nameKey: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'ILS', nameKey: 'profileSettings.currencyNames.ils', symbol: '\u20AA' },
  { code: 'USD', nameKey: 'profileSettings.currencyNames.usd', symbol: '$' },
  { code: 'EUR', nameKey: 'profileSettings.currencyNames.eur', symbol: '\u20AC' },
  { code: 'GBP', nameKey: 'profileSettings.currencyNames.gbp', symbol: '\u00A3' },
];

export const DEFAULT_CURRENCY = 'ILS';

export function getCurrencyOption(code: string): CurrencyOption | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

export function formatCurrencyLabel(code: string, name: string): string {
  const option = getCurrencyOption(code);
  const symbol = option?.symbol || code;
  return `${name} (${code}) ${symbol}`;
}
