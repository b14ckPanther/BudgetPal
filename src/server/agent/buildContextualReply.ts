/**
 * Deterministic, context-aware agent replies for greetings and scope redirects.
 * No extra OpenAI calls; uses verified budget context only.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { calculateBudgetSummary } from '../../lib/budgets';
import { formatCategoryForSpeech } from '../../lib/speechText';
import { loadUserContext } from './loadUserContext';
import { AgentLanguage, getAgentRepliesCatalog } from './language';
import {
  pickUnusedVariant,
  shouldIncludeGreetingInsight,
  shouldMentionSafeToSpend,
} from './responseSelection';

type AgentReplies = ReturnType<typeof getAgentRepliesCatalog>;

export interface AgentReplyContext {
  firstName?: string;
  hasTransactions: boolean;
  hasLimits: boolean;
  safeToSpend: number | null;
  currency: string;
  warningCategory?: string;
  warningPercent?: number;
}

export interface ContextualReply {
  message: string;
  suggestedPrompts: string[];
}

function pickVariant<T>(variants: readonly T[], rotationIndex: number): T {
  const index = ((rotationIndex % variants.length) + variants.length) % variants.length;
  return variants[index];
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}

function nameVars(firstName?: string, rotationIndex = 0): Record<string, string> {
  const useName = !!firstName?.trim() && rotationIndex % 3 !== 2;
  const name = useName ? firstName!.trim() : '';
  return {
    name,
    namePrefix: name ? `${name}, ` : '',
    nameHey: name ? `Hey ${name}. ` : '',
    nameHi: name ? `Hi ${name}. ` : '',
  };
}

function pickPrompts(
  sets: readonly (readonly string[])[],
  rotationIndex: number,
  vars: Record<string, string>
): string[] {
  const chosen = pickVariant(sets, rotationIndex);
  return chosen.map((prompt) => applyTemplate(prompt, vars));
}

export async function getIntentRotationIndex(
  supabase: SupabaseClient<Database>,
  userId: string,
  intent: string
): Promise<number> {
  const { count, error } = await supabase
    .from('agent_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .eq('intent', intent);

  if (error) return 0;
  return count ?? 0;
}

export async function loadRecentAgentReplies(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 10
): Promise<string[]> {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('content')
    .eq('user_id', userId)
    .eq('role', 'agent')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => row.content).filter((content): content is string => !!content);
}

export async function loadAgentReplyContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  userName: string
): Promise<AgentReplyContext> {
  const ctx = await loadUserContext(supabase, userId);
  const summary = calculateBudgetSummary(
    ctx.budget
      ? {
          cycleStartDay: ctx.budget.cycleStartDay,
          monthlyIncome: ctx.budget.monthlyIncome,
          currency: ctx.budget.currency,
        }
      : null,
    ctx.transactions,
    ctx.categories,
    ctx.limits
  );

  const hasTransactions = ctx.transactions.length > 0;
  const hasLimits = ctx.limits.some((limit) => limit.monthlyLimit > 0);
  const nearLimit = summary.categories
    .filter((cat) => cat.limit > 0)
    .sort((a, b) => b.percentage - a.percentage)[0];
  const topWarning = summary.warnings[0];

  return {
    firstName: userName && userName !== 'there' ? userName : undefined,
    hasTransactions,
    hasLimits,
    safeToSpend: summary.safeToSpend,
    currency: ctx.currency,
    warningCategory: topWarning?.categoryName ?? nearLimit?.name,
    warningPercent: nearLimit?.percentage,
  };
}

function greetingTemplateVars(
  context: AgentReplyContext,
  rotationIndex: number
): Record<string, string> {
  return {
    ...nameVars(context.firstName, rotationIndex),
    category: formatCategoryForSpeech(context.warningCategory || 'your budget'),
    percent: context.warningPercent != null ? String(Math.round(context.warningPercent)) : '',
    safeAmount:
      context.safeToSpend != null ? String(Math.max(0, Math.floor(context.safeToSpend))) : '',
    currency: context.currency,
  };
}

export function buildGreetingReply(
  context: AgentReplyContext,
  rotationIndex: number,
  language: AgentLanguage = 'en',
  recentReplies: string[] = []
): ContextualReply {
  const templates = getAgentRepliesCatalog(language) as AgentReplies;
  const vars = greetingTemplateVars(context, rotationIndex);

  let pool: readonly string[];
  let promptSets: readonly (readonly string[])[];

  if (!context.hasLimits || context.safeToSpend === null) {
    pool = templates.greeting.noLimits;
    promptSets = templates.promptSets.setupBudget;
  } else if (!context.hasTransactions) {
    pool = templates.greeting.noTransactions;
    promptSets = templates.promptSets.firstTransaction;
  } else if (
    shouldIncludeGreetingInsight(context, rotationIndex, recentReplies) &&
    context.warningPercent != null &&
    context.warningPercent >= 100 &&
    templates.greeting.overBudget?.length
  ) {
    pool = templates.greeting.overBudget;
    promptSets = templates.promptSets.nearLimit;
  } else if (shouldIncludeGreetingInsight(context, rotationIndex, recentReplies)) {
    pool = templates.greeting.withInsight ?? templates.greeting.nearLimit;
    promptSets = templates.promptSets.nearLimit;
  } else if (shouldMentionSafeToSpend(context.safeToSpend, rotationIndex, recentReplies)) {
    pool = templates.greeting.safeToSpend;
    promptSets = templates.promptSets.dailySpend;
  } else {
    pool = templates.greeting.default;
    promptSets = templates.promptSets.general;
  }

  const message = pickUnusedVariant(pool, rotationIndex, recentReplies, (template) =>
    applyTemplate(template, vars).replace(/\s+/g, ' ').trim()
  );

  return {
    message,
    suggestedPrompts: pickPrompts(promptSets, rotationIndex, vars),
  };
}

export function buildOutOfScopeReply(
  context: AgentReplyContext,
  rotationIndex: number,
  message: string,
  language: AgentLanguage = 'en',
  recentReplies: string[] = []
): ContextualReply {
  const templates = getAgentRepliesCatalog(language) as AgentReplies;
  const lower = message.toLowerCase();
  const spendHint = /dinner|lunch|coffee|afford|buy|spend|purchase|shop/i.test(lower);
  const pool = spendHint ? templates.outOfScope.spendHint : templates.outOfScope.general;
  const promptSets = spendHint ? templates.promptSets.affordability : templates.promptSets.general;
  const vars = nameVars(context.firstName, rotationIndex);

  return {
    message: pickUnusedVariant(pool, rotationIndex, recentReplies, (template) =>
      applyTemplate(template, vars).replace(/\s+/g, ' ').trim()
    ),
    suggestedPrompts: pickPrompts(promptSets, rotationIndex, vars),
  };
}

export function buildUnclearReply(
  rotationIndex: number,
  language: AgentLanguage = 'en',
  recentReplies: string[] = []
): ContextualReply {
  const templates = getAgentRepliesCatalog(language) as AgentReplies;
  return {
    message: pickUnusedVariant(templates.unclear, rotationIndex, recentReplies, (template) =>
      template.trim()
    ),
    suggestedPrompts: pickPrompts(templates.promptSets.general, rotationIndex, {}),
  };
}

export function buildAppGuidanceReply(
  context: AgentReplyContext,
  rotationIndex: number,
  language: AgentLanguage = 'en',
  recentReplies: string[] = []
): ContextualReply {
  const templates = getAgentRepliesCatalog(language) as AgentReplies;
  const greeting = buildGreetingReply(context, rotationIndex, language, recentReplies);
  return {
    message: pickUnusedVariant(templates.appGuidance, rotationIndex, recentReplies, (template) =>
      template.trim()
    ),
    suggestedPrompts: greeting.suggestedPrompts,
  };
}
