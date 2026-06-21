/**
 * AI narrative for reports — verified facts only, with deterministic fallback.
 */

import { z } from 'zod';
import { chatCompletion } from '../ai';
import { REPORT_AI_MODEL } from './reportConfig';
import type { ComputedReport } from './reportTypes';

export const ReportNarrativeSchema = z.object({
  summary: z.string().min(1).max(600),
  recommendations: z.array(z.string().min(1).max(200)).min(1).max(3),
});

export type ReportNarrative = z.infer<typeof ReportNarrativeSchema>;

function buildFactsPayload(report: ComputedReport): string {
  const m = report.metrics;
  return JSON.stringify({
    title: report.title,
    period: report.range.label,
    totalIncome: m.totalIncome,
    totalExpenses: m.totalExpenses,
    netSavings: m.netSavings,
    currency: m.currency,
    safeToSpend: m.safeToSpend,
    topCategories: m.categoryBreakdown.slice(0, 3).map((c) => ({
      name: c.categoryName,
      amount: c.amount,
      overBudget: c.isOverBudget,
    })),
    overBudget: m.overBudgetCategories.map((c) => c.categoryName),
    trend: m.trend
      ? {
          previousPeriod: m.trend.previousPeriodLabel,
          expenseChangePercent: m.trend.expenseChangePercent,
        }
      : null,
    recurringCount: m.recurringSignals.length,
  });
}

function deterministicNarrative(report: ComputedReport): ReportNarrative {
  const m = report.metrics;
  const parts: string[] = [];
  parts.push(
    `During ${report.range.label}, you recorded ${m.totalExpenses.toFixed(0)} ${m.currency} in expenses`
  );
  if (m.totalIncome > 0) {
    parts.push(`and ${m.totalIncome.toFixed(0)} ${m.currency} in income`);
  }
  parts.push(`(net ${m.netSavings >= 0 ? '+' : ''}${m.netSavings.toFixed(0)} ${m.currency}).`);
  if (m.trend) {
    parts.push(
      ` Expenses changed ${m.trend.expenseChangePercent >= 0 ? '+' : ''}${m.trend.expenseChangePercent}% compared to ${m.trend.previousPeriodLabel}.`
    );
  }
  return {
    summary: parts.join(''),
    recommendations: m.recommendations.slice(0, 3),
  };
}

export async function generateReportNarrative(report: ComputedReport): Promise<ReportNarrative> {
  const fallback = deterministicNarrative(report);

  try {
    const responseText = await chatCompletion(
      [
        {
          role: 'system',
          content: `You write concise budget report summaries. Use ONLY the provided facts. Do not invent numbers, merchants, or trends. Return JSON: { "summary": string (max 2 sentences), "recommendations": string[] (1-3 practical items) }. Currency is labeled as ${report.metrics.currency}, not symbols.`,
        },
        {
          role: 'user',
          content: `Facts:\n${buildFactsPayload(report)}`,
        },
      ],
      {
        model: REPORT_AI_MODEL,
        temperature: 0.2,
        maxTokens: 350,
        responseFormat: { type: 'json_object' },
      }
    );

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const parsed = ReportNarrativeSchema.parse(JSON.parse(cleaned));
    return parsed;
  } catch {
    return fallback;
  }
}

/** Agent preview — no AI call. */
export function buildAgentReportSummary(report: ComputedReport): ReportNarrative {
  return deterministicNarrative(report);
}
