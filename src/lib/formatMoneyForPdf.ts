/**
 * PDF-safe money formatting — avoids currency glyphs that standard PDF fonts cannot render.
 */

const CURRENCY_LABELS: Record<string, string> = {
  ILS: 'ILS',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
};

export function formatMoneyForPdf(amount: number, currency = 'ILS'): string {
  const label = CURRENCY_LABELS[currency] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${label}`;
}

/** Truncate long labels for PDF layout with ellipsis. */
export function truncatePdfLabel(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
