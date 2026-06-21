/**
 * Builds concise on-device TTS summaries for agent responses.
 * Avoids raw card JSON, long reports, and backend error strings.
 */

import { AgentCard, AgentIntent } from '@/types/agent';
import { t, getI18nLocale } from '@/lib/i18n';
import {
  formatCategoryForSpeech,
  formatDaysForSpeech,
  formatMoneyForSpeech,
  formatPercentForSpeech,
  normalizeAgentSpeechText,
} from '@/lib/speechText';

export type SpeakableOutcome = 'confirmed' | 'cancelled' | 'error';

export interface SpeakableSummaryInput {
  intent?: AgentIntent;
  message: string;
  cards?: AgentCard[];
  firstName?: string;
  currency?: string;
  outcome?: SpeakableOutcome;
}

function firstSentence(text: string, maxLen = 160): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  const sentence = (match?.[0] ?? trimmed).trim();
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

function transactionPreviewSummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const amount = formatMoneyForSpeech(data.amount, (data.currency as string) || currency);
  const label = (data.title as string) || (data.merchant as string) || 'this item';
  const type = data.type === 'income' ? 'income' : 'expense';
  return t('agentSpeech.transactionPreview', { amount, label, type });
}

function receiptPreviewSummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const cardCurrency = (data.currency as string) || currency;
  const merchant = (data.merchant as string) || 'the merchant';
  const amount =
    data.totalAmount != null
      ? formatMoneyForSpeech(data.totalAmount, cardCurrency)
      : formatMoneyForSpeech(0, cardCurrency, { style: 'full' });
  if (data.totalAmount == null || data.requiresManualAmount) {
    return t('agentSpeech.receiptPreviewMissingAmount', { merchant });
  }
  return t('agentSpeech.receiptPreview', { merchant, amount });
}

function spendingAnalysisSummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const topItem = data.topItem as { name?: string; amount?: number } | undefined;
  const cardCurrency = (data.currency as string) || currency;

  if (topItem?.name && topItem.amount != null) {
    const top = t('agentSpeech.spendingTop', {
      name: formatCategoryForSpeech(topItem.name),
      amount: formatMoneyForSpeech(topItem.amount, cardCurrency),
    });
    return top;
  }

  const explanation = firstSentence((data.explanation as string) || '');
  if (explanation) return explanation;

  return t('agentSpeech.spendingFallback');
}

function affordabilitySummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const verdict = String(data.verdict || '');
  const item = (data.itemLabel as string) || 'this purchase';
  const amount =
    data.amount != null ? formatMoneyForSpeech(data.amount, (data.currency as string) || currency) : '';

  switch (verdict) {
    case 'safe':
      return amount
        ? t('agentSpeech.affordabilitySafeWithAmount', { item, amount })
        : t('agentSpeech.affordabilitySafe');
    case 'caution':
      return t('agentSpeech.affordabilityCaution');
    case 'not_recommended':
      return amount
        ? t('agentSpeech.affordabilityNotRecommendedWithAmount', { item, amount })
        : t('agentSpeech.affordabilityNotRecommended');
    case 'need_budget_setup':
      return t('agentSpeech.affordabilityNeedSetup');
    default:
      return t('agentSpeech.affordabilityFallback');
  }
}

function savingAdviceSummary(card: AgentCard): string {
  const data = card.data;
  const observation = firstSentence((data.observation as string) || '');
  const actions = (data.actions as string[]) || [];
  const action = actions[0] ? firstSentence(actions[0], 120) : '';
  if (observation && action) return `${observation} ${action}`;
  return observation || action || t('agentSpeech.savingFallback');
}

function budgetWarningSummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const category = formatCategoryForSpeech(String(data.categoryName || 'this category'));
  const percent = data.percentUsed ?? data.percentage ?? data.usedPercent;
  const daysLeft = data.daysLeft;

  if (percent != null && daysLeft != null) {
    return t('agentSpeech.budgetWarning', {
      category,
      percent: formatPercentForSpeech(percent),
      days: formatDaysForSpeech(daysLeft),
    });
  }

  if (data.safeToSpend != null) {
    return t('agentSpeech.budgetWarningSafeToSpend', {
      amount: formatMoneyForSpeech(data.safeToSpend, (data.currency as string) || currency),
    });
  }

  const message = firstSentence(String(data.message || ''));
  return message || t('agentSpeech.budgetWarningFallback');
}

function budgetLimitSummary(card: AgentCard, currency: string): string {
  const data = card.data;
  const operation = String(data.operation || 'set');
  const category = formatCategoryForSpeech(
    (data.categoryName as string) || (data.targetCategoryName as string) || 'this category'
  );
  const cardCurrency = (data.currency as string) || currency;

  if (operation === 'move') {
    const source = formatCategoryForSpeech((data.sourceCategoryName as string) || 'one category');
    const target = formatCategoryForSpeech((data.targetCategoryName as string) || category);
    return t('agentSpeech.budgetMove', {
      amount: formatMoneyForSpeech(data.amount, cardCurrency, { style: 'full' }),
      source,
      target,
    });
  }

  if (
    operation === 'increase' &&
    data.currentLimit != null &&
    data.proposedLimit != null
  ) {
    return t('agentSpeech.budgetIncreaseFromTo', {
      category,
      from: formatMoneyForSpeech(data.currentLimit, cardCurrency, { style: 'full' }),
      to: formatMoneyForSpeech(data.proposedLimit, cardCurrency, { style: 'full' }),
    });
  }

  if (operation === 'increase') {
    return t('agentSpeech.budgetIncrease', {
      category,
      amount: formatMoneyForSpeech(data.amount, cardCurrency, { style: 'full' }),
    });
  }

  if (operation === 'decrease') {
    return t('agentSpeech.budgetDecrease', {
      category,
      amount: formatMoneyForSpeech(data.amount, cardCurrency, { style: 'full' }),
    });
  }

  if (data.currentLimit != null && data.proposedLimit != null) {
    return t('agentSpeech.budgetSetFromTo', {
      category,
      from: formatMoneyForSpeech(data.currentLimit, cardCurrency, { style: 'full' }),
      to: formatMoneyForSpeech(data.proposedLimit, cardCurrency, { style: 'full' }),
    });
  }

  return t('agentSpeech.budgetSet', {
    category,
    amount: formatMoneyForSpeech(data.proposedLimit ?? data.amount, cardCurrency, { style: 'full' }),
  });
}

function summaryFromCards(cards: AgentCard[], currency: string): string | null {
  for (const card of cards) {
    if (card.type === 'transaction_preview' || card.type === 'voice_preview') {
      return transactionPreviewSummary(card, currency);
    }
    if (card.type === 'receipt_preview') {
      return receiptPreviewSummary(card, currency);
    }
    if (card.type === 'spending_analysis') {
      return spendingAnalysisSummary(card, currency);
    }
    if (card.type === 'affordability') {
      return affordabilitySummary(card, currency);
    }
    if (card.type === 'saving_advice') {
      return savingAdviceSummary(card);
    }
    if (card.type === 'budget_limit_proposal') {
      return budgetLimitSummary(card, currency);
    }
    if (card.type === 'budget_warning') {
      return budgetWarningSummary(card, currency);
    }
  }
  return null;
}

export function buildAgentSpeakableSummary(input: SpeakableSummaryInput): string | null {
  const currency = input.currency || 'ILS';
  let raw: string | null = null;

  if (input.outcome === 'confirmed') {
    raw = t('agentSpeech.confirmed');
  } else if (input.outcome === 'cancelled') {
    raw = t('agentSpeech.cancelled');
  } else if (input.outcome === 'error') {
    raw = t('agentSpeech.error');
  } else {
    const cardSummary = input.cards?.length ? summaryFromCards(input.cards, currency) : null;
    if (cardSummary) {
      raw = cardSummary;
    } else if (
      input.intent === 'casual_greeting' ||
      input.intent === 'app_guidance' ||
      input.intent === 'out_of_scope' ||
      input.intent === 'unclear'
    ) {
      const shortMessage = firstSentence(input.message, 220);
      raw = shortMessage || t('agentSpeech.greetingGeneric');
    } else {
      const shortMessage = firstSentence(input.message, 200);
      if (shortMessage && shortMessage.length <= 200) {
        raw = shortMessage;
      } else {
        raw = t('agentSpeech.fallback');
      }
    }
  }

  if (!raw) return null;
  const speechLocale = getI18nLocale() === 'he' ? 'he' : 'en';
  return normalizeAgentSpeechText(raw, currency, speechLocale);
}
