/**
 * Deterministic agent reply selection with recent-history cooldowns.
 */

const WARNING_OPENERS = ['heads up', "head's up", 'שימו לב', 'by the way', 'btw'];

export function normalizeReplyText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function messageMatchesRecent(text: string, recent: string[], within: number): boolean {
  const norm = normalizeReplyText(text);
  if (!norm) return false;
  return recent.slice(0, within).some((entry) => normalizeReplyText(entry) === norm);
}

export function mentionsCategory(text: string, category: string): boolean {
  if (!category.trim()) return false;
  const hay = normalizeReplyText(text);
  const needle = normalizeReplyText(category);
  return hay.includes(needle);
}

export function categoryMentionedInRecent(
  recent: string[],
  category: string,
  within: number
): boolean {
  if (!category.trim()) return false;
  return recent.slice(0, within).some((entry) => mentionsCategory(entry, category));
}

export function recentPhraseInWindow(
  recent: string[],
  phrases: readonly string[],
  within: number
): boolean {
  const window = recent.slice(0, within).map(normalizeReplyText);
  return window.some((entry) => phrases.some((phrase) => entry.includes(normalizeReplyText(phrase))));
}

export function sharesOpeningWithRecent(text: string, recent: string[], within: number): boolean {
  const opener = normalizeReplyText(text.split(/[.!?]/)[0] || text).slice(0, 48);
  if (!opener) return false;
  return recent.slice(0, within).some((entry) => {
    const other = normalizeReplyText(entry.split(/[.!?]/)[0] || entry).slice(0, 48);
    return opener === other;
  });
}

export function shouldIncludeGreetingInsight(
  context: {
    warningCategory?: string;
    warningPercent?: number;
  },
  rotationIndex: number,
  recentReplies: string[]
): boolean {
  const category = context.warningCategory?.trim();
  const percent = context.warningPercent;
  if (!category || percent == null || percent < 75) return false;
  if (categoryMentionedInRecent(recentReplies, category, 5)) return false;
  if (recentPhraseInWindow(recentReplies, WARNING_OPENERS, 5)) return false;
  return rotationIndex % 4 === 0;
}

export function shouldMentionSafeToSpend(
  safeToSpend: number | null,
  rotationIndex: number,
  recentReplies: string[]
): boolean {
  if (safeToSpend == null || safeToSpend <= 0) return false;
  if (recentPhraseInWindow(recentReplies, ['safe to spend', 'safe-to-spend', 'בטוח לבזבוז'], 5)) {
    return false;
  }
  return rotationIndex % 5 === 2;
}

export function pickUnusedVariant<T extends string>(
  pool: readonly T[],
  rotationIndex: number,
  recentReplies: string[],
  render: (template: T) => string,
  options?: { exactCooldown?: number; openerCooldown?: number }
): string {
  if (pool.length === 0) return '';

  const exactCooldown = options?.exactCooldown ?? 10;
  const openerCooldown = options?.openerCooldown ?? 5;
  const attempts = pool.length * 2;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const index = ((rotationIndex + attempt) % pool.length + pool.length) % pool.length;
    const rendered = render(pool[index]);
    if (messageMatchesRecent(rendered, recentReplies, exactCooldown)) continue;
    if (sharesOpeningWithRecent(rendered, recentReplies, openerCooldown)) continue;
    return rendered;
  }

  const fallback = render(pool[rotationIndex % pool.length]);
  return fallback;
}
