/**
 * Server-side agent language resolution.
 */

import en from '../../locales/en.json';
import he from '../../locales/he.json';

export type AgentLanguage = 'en' | 'he';

export function resolveAgentLanguage(preferredLanguage?: string | null): AgentLanguage {
  return preferredLanguage === 'he' ? 'he' : 'en';
}

export function getLanguageInstruction(language: AgentLanguage): string {
  if (language === 'he') {
    return [
      'The authenticated user\'s app language is Hebrew (he-IL).',
      'Write all user-facing natural-language fields (such as "message", summaries, confirmations, and guidance) in natural Israeli Hebrew.',
      'Keep JSON keys, intent names, category IDs, ISO currency codes, and numeric values structured and language-neutral.',
      'Do not translate merchant names, user-entered notes, or historic chat content.',
      'Financial calculations and category matching still use the English category names from the database.',
    ].join(' ');
  }

  return 'The authenticated user\'s app language is English. Write all user-facing natural-language fields in clear English.';
}

export function getAgentRepliesCatalog(language: AgentLanguage) {
  return language === 'he' ? he.agentReplies : en.agentReplies;
}
