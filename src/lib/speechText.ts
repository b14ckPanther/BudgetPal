/**
 * Deterministic on-device speech text normalization.
 * Used only for TTS — never for UI display.
 */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

const SCALE = ['', 'thousand', 'million'];

export type MoneySpeechStyle = 'short' | 'full';

export interface CurrencySpeechUnit {
  singular: string;
  plural: string;
  fullSingular?: string;
  fullPlural?: string;
}

const CURRENCY_UNITS: Record<string, CurrencySpeechUnit> = {
  ILS: {
    singular: 'shekel',
    plural: 'shekels',
    fullSingular: 'Israeli shekel',
    fullPlural: 'Israeli shekels',
  },
  USD: {
    singular: 'US dollar',
    plural: 'US dollars',
  },
  EUR: {
    singular: 'euro',
    plural: 'euros',
  },
  GBP: {
    singular: 'pound',
    plural: 'pounds',
  },
};

const HEBREW_CURRENCY_UNITS: Record<string, CurrencySpeechUnit> = {
  ILS: { singular: 'שקל', plural: 'שקלים', fullSingular: 'שקל ישראלי', fullPlural: 'שקלים ישראליים' },
  USD: { singular: 'דולר אמריקאי', plural: 'דולרים אמריקאיים' },
  EUR: { singular: 'אירו', plural: 'אירו' },
  GBP: { singular: 'לירה שטרלינג', plural: 'לירות שטרלינג' },
};

export type SpeechLocale = 'en' | 'he';

const CURRENCY_ALIASES: Record<string, string> = {
  ILS: 'ILS',
  '₪': 'ILS',
  NIS: 'ILS',
  USD: 'USD',
  $: 'USD',
  US$: 'USD',
  EUR: 'EUR',
  '€': 'EUR',
  GBP: 'GBP',
  '£': 'GBP',
};

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeCurrencyCode(currency?: string): string {
  const raw = (currency || 'ILS').trim();
  return CURRENCY_ALIASES[raw] || CURRENCY_ALIASES[raw.toUpperCase()] || raw.toUpperCase();
}

function intToWords(n: number): string {
  if (n < 0) return `minus ${intToWords(-n)}`;
  if (n < 20) return ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return rest ? `${TENS[tens]}-${ONES[rest]}` : TENS[tens];
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = `${ONES[hundreds]} hundred`;
    return rest ? `${hundredPart} ${intToWords(rest)}` : hundredPart;
  }

  for (let scale = SCALE.length - 1; scale >= 1; scale -= 1) {
    const unit = 1000 ** scale;
    if (n >= unit) {
      const leading = Math.floor(n / unit);
      const rest = n % unit;
      const leadingWords = `${intToWords(leading)} ${SCALE[scale]}`;
      return rest ? `${leadingWords} ${intToWords(rest)}` : leadingWords;
    }
  }

  return String(n);
}

function amountToWords(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? 'minus ' : '';
  const whole = Math.floor(abs);
  const fraction = Math.round((abs - whole) * 100);

  if (fraction === 0) {
    return `${sign}${intToWords(whole)}`.trim();
  }

  if (fraction % 10 === 0) {
    return `${sign}${intToWords(whole)} point ${intToWords(fraction / 10)}`.trim();
  }

  return `${sign}${intToWords(whole)} point ${intToWords(fraction)}`.trim();
}

function currencyUnitPhrase(
  amount: number,
  currency: string,
  style: MoneySpeechStyle = 'short',
  speechLocale: SpeechLocale = 'en'
): string {
  const code = normalizeCurrencyCode(currency);
  const units = speechLocale === 'he' ? HEBREW_CURRENCY_UNITS : CURRENCY_UNITS;
  const unit = units[code];
  const abs = Math.abs(amount);
  const isSingular = abs === 1 || abs === -1;

  if (!unit) {
    return isSingular ? code : code;
  }

  if (style === 'full' && unit.fullSingular && unit.fullPlural) {
    return isSingular ? unit.fullSingular : unit.fullPlural;
  }

  return isSingular ? unit.singular : unit.plural;
}

export function formatIntegerForSpeech(value: unknown): string {
  const n = parseNumeric(value);
  if (n == null) return '';
  return intToWords(Math.round(Math.abs(n)));
}

export function formatDaysForSpeech(value: unknown): string {
  const n = parseNumeric(value);
  if (n == null) return '';
  const count = Math.round(Math.abs(n));
  const words = intToWords(count);
  return count === 1 ? `${words} day` : `${words} days`;
}

export function formatMoneyForSpeech(
  amount: unknown,
  currency = 'ILS',
  options?: { style?: MoneySpeechStyle; speechLocale?: SpeechLocale }
): string {
  const n = parseNumeric(amount);
  if (n == null) return '';

  const style = options?.style ?? 'short';
  const speechLocale = options?.speechLocale ?? 'en';
  const words = amountToWords(n);
  const unit = currencyUnitPhrase(n, currency, style, speechLocale);
  return `${words} ${unit}`;
}

export function formatPercentForSpeech(value: unknown): string {
  const n = parseNumeric(value);
  if (n == null) return '';
  const rounded = Math.round(n);
  return `${intToWords(rounded)} percent`;
}

export function formatCategoryForSpeech(name: string): string {
  return name
    .trim()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ');
}

function formatIsoDateForSpeech(value: string): string {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (month < 1 || month > 12 || day < 1 || day > 31) return value;
  return `${months[month - 1]} ${intToWords(day)}, ${intToWords(year)}`;
}

function replaceCurrencyPatterns(text: string, profileCurrency = 'ILS', speechLocale: SpeechLocale = 'en'): string {
  let result = text;

  const moneyOpts = { speechLocale };

  result = result.replace(/₪\s*([\d,]+(?:\.\d+)?)/g, (_, amount) =>
    formatMoneyForSpeech(parseNumeric(amount), 'ILS', moneyOpts)
  );

  result = result.replace(
    /\b(ILS|USD|EUR|GBP|NIS)\s*([\d,]+(?:\.\d+)?)/gi,
    (_, code, amount) => formatMoneyForSpeech(parseNumeric(amount), String(code).toUpperCase(), moneyOpts)
  );

  result = result.replace(
    /([\d,]+(?:\.\d+)?)\s*(ILS|USD|EUR|GBP|NIS|₪)\b/gi,
    (_, amount, code) => formatMoneyForSpeech(parseNumeric(amount), String(code).toUpperCase(), moneyOpts)
  );

  result = result.replace(/\$\s*([\d,]+(?:\.\d+)?)/g, (_, amount) =>
    formatMoneyForSpeech(parseNumeric(amount), 'USD', moneyOpts)
  );

  result = result.replace(/€\s*([\d,]+(?:\.\d+)?)/g, (_, amount) =>
    formatMoneyForSpeech(parseNumeric(amount), 'EUR', moneyOpts)
  );

  result = result.replace(/£\s*([\d,]+(?:\.\d+)?)/g, (_, amount) =>
    formatMoneyForSpeech(parseNumeric(amount), 'GBP', moneyOpts)
  );

  if (speechLocale === 'he') {
    result = result.replace(/\bILS\b/g, 'שקלים');
    result = result.replace(/\bNIS\b/gi, 'שקלים');
  } else {
    result = result.replace(/\bILS\b/g, profileCurrency === 'ILS' ? 'shekels' : 'ILS');
    result = result.replace(/\bNIS\b/gi, 'shekels');
  }

  return result;
}

function replacePercentPatterns(text: string): string {
  return text.replace(/([\d,]+(?:\.\d+)?)\s*%/g, (_, value) =>
    formatPercentForSpeech(parseNumeric(value))
  );
}

function replaceDatePatterns(text: string): string {
  return text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (date) => formatIsoDateForSpeech(date));
}

function replaceAbbreviations(text: string): string {
  return text
    .replace(/\bvs\.\b/gi, 'versus')
    .replace(/\be\.g\.\b/gi, 'for example')
    .replace(/\bi\.e\.\b/gi, 'that is')
    .replace(/\betc\.\b/gi, 'and so on')
    .replace(/\bavg\.\b/gi, 'average')
    .replace(/\bmin\.\b/gi, 'minimum')
    .replace(/\bmax\.\b/gi, 'maximum');
}

/**
 * Final pass for agent speech strings. Avoid passing raw UI labels through this
 * when possible — prefer structured summaries built with the helpers above.
 */
export function normalizeAgentSpeechText(
  text: string,
  profileCurrency = 'ILS',
  speechLocale: SpeechLocale = 'en'
): string {
  if (!text.trim()) return '';

  let result = text
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

  result = replaceCurrencyPatterns(result, profileCurrency, speechLocale);
  result = replacePercentPatterns(result);
  result = replaceDatePatterns(result);
  result = replaceAbbreviations(result);
  result = result.replace(/\s*&\s*/g, ' and ');
  result = result.replace(/\s+/g, ' ').trim();

  if (result && !/[.!?]$/.test(result)) {
    result += '.';
  }

  return result;
}
