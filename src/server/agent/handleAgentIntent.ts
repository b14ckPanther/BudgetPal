/**
 * Routes classified agent intents to handlers and builds response payloads.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { AgentIntentType } from '../validation';
import { HierarchyCategory } from '../../lib/categoryHierarchy';
import { parseTransaction, TransactionParseError } from './parseTransaction';
import { parseSpendingQuery } from './parseSpendingQuery';
import { runSpendingAnalysis } from './runSpendingAnalysis';
import { parseAffordabilityRequest } from './parseAffordabilityRequest';
import { evaluateAffordability } from './evaluateAffordability';
import { generateSavingAdvice } from './generateSavingAdvice';
import { parseBudgetLimitChange } from './parseBudgetLimitChange';
import { buildBudgetLimitProposal } from './buildBudgetLimitProposal';
import { loadUserContext } from './loadUserContext';
import { AgentChannel } from './processAgentMessage';
import {
  buildAppGuidanceReply,
  buildGreetingReply,
  buildOutOfScopeReply,
  buildUnclearReply,
  getIntentRotationIndex,
  loadAgentReplyContext,
} from './buildContextualReply';

export interface IntentHandlerResult {
  agentResponseContent: string;
  cards: Array<{ type: string; title: string; data: Record<string, unknown> }>;
  actions: Array<Record<string, unknown>>;
  suggestedPrompts: string[];
}

export async function handleAgentIntent(
  supabase: SupabaseClient<Database>,
  userId: string,
  intent: AgentIntentType,
  message: string,
  context: {
    today: string;
    currency: string;
    userName: string;
    userCategories: HierarchyCategory[];
    classificationMessage: string;
    userMessageId?: string | null;
    channel?: AgentChannel;
    transcription?: string;
  }
): Promise<IntentHandlerResult> {
  const channel = context.channel ?? 'text';
  let agentResponseContent = context.classificationMessage;
  const cards: IntentHandlerResult['cards'] = [];
  const actions: IntentHandlerResult['actions'] = [];
  let suggestedPrompts: string[] = [];

  if (intent === 'add_transaction') {
    let proposal;
    try {
      proposal = await parseTransaction(message, {
        today: context.today,
        currency: context.currency,
        categories: context.userCategories,
      });
    } catch (err) {
      if (err instanceof TransactionParseError) {
        if (err.code === 'invalid_amount') {
          agentResponseContent =
            'I need a valid amount to log that. For example: "Lunch 45 shekels" or "Coffee 18".';
        } else {
          agentResponseContent =
            "I couldn't quite understand that transaction. Try including an amount, merchant, or category.";
        }
        suggestedPrompts = ['Lunch 45 shekels', 'Coffee 18', 'Twenty-five dinner'];
        return { agentResponseContent, cards, actions, suggestedPrompts };
      }
      throw err;
    }

    const { data: action, error: actionError } = await supabase
      .from('agent_actions')
      .insert({
        user_id: userId,
        message_id: context.userMessageId || null,
        action_type: 'CREATE_TRANSACTION',
        payload: proposal,
        status: 'proposed',
        confidence: proposal.confidence,
        requires_confirmation: true,
      })
      .select()
      .single();

    if (actionError || !action) {
      agentResponseContent = "I analyzed your request but couldn't create the transaction proposal. Let's try again.";
    } else {
      let actionId = action.id;
      let actionPayload: Record<string, unknown> = {
        ...proposal,
        source: channel === 'voice' ? 'voice' : 'text',
      };
      let voiceEntryId: string | undefined;

      if (channel === 'voice' && context.transcription) {
        const { data: voiceEntry, error: voiceError } = await supabase
          .from('voice_entries')
          .insert({
            user_id: userId,
            audio_url: null,
            transcription: context.transcription,
            interpreted_payload: proposal as Database['public']['Tables']['voice_entries']['Insert']['interpreted_payload'],
            confidence: proposal.confidence,
            status: 'pending_review',
          })
          .select()
          .single();

        if (voiceError || !voiceEntry) {
          agentResponseContent = "I transcribed your voice but couldn't prepare the transaction. Please try again.";
          await supabase.from('agent_actions').delete().eq('id', action.id);
          return { agentResponseContent, cards, actions, suggestedPrompts };
        }

        voiceEntryId = voiceEntry.id;
        actionPayload = { ...actionPayload, voiceEntryId };

        const { data: updatedAction, error: updateError } = await supabase
          .from('agent_actions')
          .update({ payload: actionPayload as Database['public']['Tables']['agent_actions']['Update']['payload'] })
          .eq('id', action.id)
          .select()
          .single();

        if (updateError || !updatedAction) {
          agentResponseContent = "I transcribed your voice but couldn't prepare the transaction. Please try again.";
          await supabase.from('voice_entries').update({ status: 'rejected' }).eq('id', voiceEntry.id);
          await supabase.from('agent_actions').delete().eq('id', action.id);
          return { agentResponseContent, cards, actions, suggestedPrompts };
        }

        actionId = updatedAction.id;
        agentResponseContent = `I heard: "${context.transcription}". Please review and confirm the transaction below:`;
        cards.push({
          type: 'voice_preview',
          title: 'Voice Transaction',
          data: {
            actionId,
            voiceEntryId,
            transcription: context.transcription,
            interpretationConfidence: proposal.confidence,
            ...proposal,
          },
        });
      } else {
        agentResponseContent = `I've prepared a transaction proposal for you. Please confirm the details below:`;
        cards.push({
          type: 'transaction_preview',
          title: 'Confirm Transaction',
          data: { actionId, ...proposal },
        });
      }

      actions.push({
        id: actionId,
        type: 'CREATE_TRANSACTION',
        payload: actionPayload,
        status: 'proposed',
        confidence: proposal.confidence,
        requiresConfirmation: true,
      });
    }
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  if (intent === 'generate_report') {
    const { parseAgentReportParams } = await import('./parseReportRequest');
    const { computeReportPreview } = await import('../reports/processReportGenerate');
    const params = parseAgentReportParams(message);
    const preview = await computeReportPreview(supabase, userId, {
      type: params.type,
      categoryTerms: params.categoryTerms,
      merchantTerms: params.merchantTerms,
      comparePrevious: params.comparePrevious,
    });

    if (!preview.ok) {
      if ('noData' in preview && preview.noData) {
        agentResponseContent = preview.message;
      } else if ('error' in preview) {
        agentResponseContent = preview.error || 'I could not build that report preview.';
      } else {
        agentResponseContent = 'I could not build that report preview.';
      }
      suggestedPrompts = ['Generate monthly report', 'Weekly report', 'Open Reports tab'];
      return { agentResponseContent, cards, actions, suggestedPrompts };
    }

    const r = preview.report;
    agentResponseContent =
      'Here is a concise report preview from your confirmed transactions. Open the Reports tab to export a PDF when you are ready.';
    cards.push({
      type: 'report',
      title: r.title,
      data: {
        period: r.range.label,
        totalIncome: r.metrics.totalIncome,
        totalExpenses: r.metrics.totalExpenses,
        netSavings: r.metrics.netSavings,
        summary: r.summary,
        recommendations: r.metrics.recommendations,
        exportHint: true,
      },
    });
    suggestedPrompts = ['Open Reports to export PDF', 'Generate weekly report', 'Category spending report'];
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  const ctx = await loadUserContext(supabase, userId);

  if (intent === 'ask_spending_analysis') {
    try {
      const spec = await parseSpendingQuery(message, {
        today: context.today,
        categories: ctx.categories,
      });
      const outcome = runSpendingAnalysis(spec, ctx.transactions, ctx.categories);

      if (!outcome.ok) {
        agentResponseContent = outcome.clarification;
        suggestedPrompts = [
          'Show me gas spending for the last 8 months',
          'What did I spend most on this month?',
        ];
      } else {
        const r = outcome.result;
        agentResponseContent = r.explanation;
        suggestedPrompts = r.suggestedPrompts;
        cards.push({
          type: 'spending_analysis',
          title: 'Spending Analysis',
          data: {
            periodLabel: r.periodLabel,
            totalSpent: r.totalSpent,
            currency: ctx.currency,
            breakdown: r.breakdown,
            topItem: r.topItem,
            trend: r.trend,
            explanation: r.explanation,
            empty: r.empty,
            categoryFilterLabel: r.categoryFilterLabel,
          },
        });
      }
    } catch (err) {
      console.error('Spending analysis error:', err);
      agentResponseContent = 'I had trouble analyzing your spending. Please try rephrasing your question.';
    }
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  if (intent === 'ask_affordability') {
    try {
      const spec = await parseAffordabilityRequest(message);
      const outcome = evaluateAffordability(spec, ctx);

      if (!outcome.ok) {
        agentResponseContent = outcome.clarification;
      } else {
        const r = outcome.result;
        agentResponseContent = r.reason;
        cards.push({
          type: 'affordability',
          title: 'Affordability Check',
          data: {
            itemLabel: r.itemLabel,
            amount: r.amount,
            currency: ctx.currency,
            verdict: r.verdict,
            safeToSpend: r.safeToSpend,
            safeToSpendAfter: r.safeToSpendAfter,
            categoryName: r.categoryName,
            categoryRemaining: r.categoryRemaining,
            categoryLimit: r.categoryLimit,
            daysLeft: r.daysLeft,
            reason: r.reason,
          },
        });
        suggestedPrompts = ['Set Food & Drinks budget to 600', 'Where am I overspending?'];
      }
    } catch (err) {
      console.error('Affordability error:', err);
      agentResponseContent = 'Please include an amount, e.g. "Can I afford headphones for 300?"';
    }
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  if (intent === 'ask_saving_advice') {
    const advice = generateSavingAdvice(ctx);
    agentResponseContent = advice.observation;
    cards.push({
      type: 'saving_advice',
      title: 'Saving Advice',
      data: {
        observation: advice.observation,
        actions: advice.actions,
        empty: advice.empty,
      },
    });
    suggestedPrompts = [
      'What did I spend most on this month?',
      'Compare my food spending this month to last month',
    ];
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  if (intent === 'update_budget_limit' || intent === 'move_budget_limit') {
    try {
      const parsed = await parseBudgetLimitChange(message, ctx.categories);
      const outcome = buildBudgetLimitProposal(parsed, ctx);

      if (!outcome.ok) {
        agentResponseContent = outcome.clarification;
      } else {
        const proposal = outcome.proposal;
        const actionType =
          proposal.operation === 'move' ? 'MOVE_BUDGET_LIMIT' : 'UPDATE_BUDGET_LIMIT';

        const { data: action, error: actionError } = await supabase
          .from('agent_actions')
          .insert({
            user_id: userId,
            message_id: context.userMessageId || null,
            action_type: actionType,
            payload: proposal,
            status: 'proposed',
            confidence: proposal.confidence,
            requires_confirmation: true,
          })
          .select()
          .single();

        if (actionError || !action) {
          agentResponseContent = 'I could not create the budget change proposal. Please try again.';
        } else {
          agentResponseContent = 'Review this budget limit change and confirm when ready:';
          cards.push({
            type: 'budget_limit_proposal',
            title: 'Budget Limit Change',
            data: { actionId: action.id, ...proposal, currency: ctx.currency },
          });
          actions.push({
            id: action.id,
            type: actionType,
            payload: proposal,
            status: 'proposed',
            confidence: proposal.confidence,
            requiresConfirmation: true,
          });
        }
      }
    } catch (err) {
      console.error('Budget limit parse error:', err);
      agentResponseContent = 'I could not understand that budget change. Try "Set Food & Drinks to 600" or "Move 100 from Shopping to Food & Drinks".';
    }
    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  if (intent === 'casual_greeting' || intent === 'app_guidance' || intent === 'out_of_scope' || intent === 'unclear') {
    const replyContext = await loadAgentReplyContext(supabase, userId, context.userName);
    const rotation = await getIntentRotationIndex(supabase, userId, intent);

    if (intent === 'casual_greeting') {
      const reply = buildGreetingReply(replyContext, rotation);
      agentResponseContent = reply.message;
      suggestedPrompts = reply.suggestedPrompts;
    } else if (intent === 'app_guidance') {
      const reply = buildAppGuidanceReply(replyContext, rotation);
      agentResponseContent = reply.message;
      suggestedPrompts = reply.suggestedPrompts;
    } else if (intent === 'out_of_scope') {
      const reply = buildOutOfScopeReply(replyContext, rotation, message);
      agentResponseContent = reply.message;
      suggestedPrompts = reply.suggestedPrompts;
    } else {
      const reply = buildUnclearReply(rotation);
      agentResponseContent = reply.message;
      suggestedPrompts = reply.suggestedPrompts;
    }

    return { agentResponseContent, cards, actions, suggestedPrompts };
  }

  return { agentResponseContent, cards, actions, suggestedPrompts };
}
