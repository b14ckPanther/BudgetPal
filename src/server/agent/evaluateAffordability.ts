/**
 * Deterministic affordability evaluation using the shared budget engine.
 */

import { calculateBudgetSummary } from '../../lib/budgets';
import { resolveCategoryTerms, HierarchyCategory } from '../../lib/categoryHierarchy';
import { AffordabilityRequestSpec, AffordabilityVerdict } from '../validation';
import { AnalysisTransaction } from './filterTransactions';
import { UserAgentContext } from './loadUserContext';

export interface AffordabilityResult {
  verdict: AffordabilityVerdict;
  itemLabel: string;
  amount: number;
  safeToSpend: number | null;
  safeToSpendAfter: number | null;
  categoryName?: string;
  categoryRemaining?: number;
  categoryLimit?: number;
  daysLeft: number;
  reason: string;
}

export type AffordabilityOutcome =
  | { ok: true; result: AffordabilityResult }
  | { ok: false; clarification: string };

export function evaluateAffordability(
  spec: AffordabilityRequestSpec,
  ctx: UserAgentContext
): AffordabilityOutcome {
  if (!spec.amount || spec.amount <= 0) {
    return {
      ok: false,
      clarification: 'Please tell me the amount you are considering, e.g. "Can I afford headphones for 300?"',
    };
  }

  const summary = calculateBudgetSummary(
    ctx.budget,
    ctx.transactions,
    ctx.categories,
    ctx.limits
  );

  const itemLabel = spec.itemLabel?.trim() || 'This purchase';
  const daysLeft = summary.daysLeft;

  if (!ctx.budget || ctx.limits.length === 0 || summary.safeToSpend === null) {
    return {
      ok: true,
      result: {
        verdict: 'need_budget_setup',
        itemLabel,
        amount: spec.amount,
        safeToSpend: null,
        safeToSpendAfter: null,
        daysLeft,
        reason:
          'Category limits are not configured yet, so I cannot give a reliable affordability answer. Set category limits on the Budget screen to activate safe-to-spend guidance.',
      },
    };
  }

  const safeToSpend = summary.safeToSpend;
  const dailyAfter =
    daysLeft > 0
      ? Math.max(0, (summary.overallLimit - summary.overallSpent - spec.amount) / daysLeft)
      : 0;

  let categoryName: string | undefined;
  let categoryRemaining: number | undefined;
  let categoryLimit: number | undefined;

  if (spec.categoryTerm) {
    const catRes = resolveCategoryTerms([spec.categoryTerm], ctx.categories);
    if (catRes.ok && catRes.categoryIds.length > 0) {
      const parentId = catRes.categoryIds.find((id) => {
        const cat = ctx.categories.find((c) => c.id === id);
        return cat && !cat.parentCategoryId;
      }) || catRes.categoryIds[0];

      const catSummary = summary.categories.find((c) => c.categoryId === parentId);
      if (catSummary && catSummary.limit > 0) {
        categoryName = catSummary.name;
        categoryRemaining = catSummary.remaining;
        categoryLimit = catSummary.limit;
      }
    }
  }

  let verdict: AffordabilityVerdict = 'safe';
  let reason = '';

  const projectedDailyDrop = safeToSpend - dailyAfter;
  const categoryWouldOver =
    categoryRemaining !== undefined && spec.amount > categoryRemaining;

  if (categoryWouldOver) {
    verdict = 'not_recommended';
    reason = `${itemLabel} for ${spec.amount} would exceed your remaining ${categoryName} budget (${categoryRemaining?.toFixed(0)} left of ${categoryLimit?.toFixed(0)}).`;
  } else if (spec.amount > safeToSpend * daysLeft * 0.5) {
    verdict = 'not_recommended';
    reason = `This would use a large share of your remaining planned budget for the cycle (${daysLeft} days left).`;
  } else if (projectedDailyDrop > safeToSpend * 0.4 || dailyAfter < safeToSpend * 0.5) {
    verdict = 'caution';
    reason = `Affordable, but your daily safe-to-spend would drop from about ${Math.floor(safeToSpend)} to ${Math.floor(dailyAfter)} per day for the rest of the cycle.`;
  } else if (categoryRemaining !== undefined && spec.amount > categoryRemaining * 0.5) {
    verdict = 'caution';
    reason = `This fits your overall budget, but it would use a meaningful portion of your remaining ${categoryName} limit.`;
  } else {
    verdict = 'safe';
    reason = `This fits within your current budget pace with about ${Math.floor(safeToSpend)} safe to spend per day for the next ${daysLeft} days.`;
  }

  if (ctx.savingsGoal > 0 && spec.amount > summary.monthlyIncome * 0.1) {
    if (verdict === 'safe') verdict = 'caution';
    reason += ` Note: you have a savings goal configured — consider whether this aligns with it.`;
  }

  return {
    ok: true,
    result: {
      verdict,
      itemLabel,
      amount: spec.amount,
      safeToSpend,
      safeToSpendAfter: dailyAfter,
      categoryName,
      categoryRemaining,
      categoryLimit,
      daysLeft,
      reason,
    },
  };
}
