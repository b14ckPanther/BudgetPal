/**
 * Fully deterministic saving advice from verified budget facts.
 */

import { calculateBudgetSummary } from '../../lib/budgets';
import { filterWithCategoryMap } from './filterTransactions';
import { getPreviousComparablePeriod, resolveDateRange } from './dateRanges';
import { UserAgentContext } from './loadUserContext';

export interface SavingAdviceResult {
  observation: string;
  actions: string[];
  empty: boolean;
}

export function generateSavingAdvice(ctx: UserAgentContext): SavingAdviceResult {
  if (!ctx.budget) {
    return {
      observation: 'Set up your budget and category limits to receive personalized saving guidance.',
      actions: ['Open the Budget screen and configure monthly category limits.'],
      empty: true,
    };
  }

  const summary = calculateBudgetSummary(
    ctx.budget,
    ctx.transactions,
    ctx.categories,
    ctx.limits
  );

  const thisMonth = resolveDateRange('this_month');
  const lastMonth = resolveDateRange('last_month');

  if (!thisMonth.ok || !lastMonth.ok) {
    return {
      observation: 'Unable to determine a comparison period for saving advice.',
      actions: [],
      empty: true,
    };
  }

  const thisTxs = filterWithCategoryMap(
    ctx.transactions,
    { start: thisMonth.range.start, end: thisMonth.range.end },
    ctx.categories
  );
  const lastTxs = filterWithCategoryMap(
    ctx.transactions,
    { start: lastMonth.range.start, end: lastMonth.range.end },
    ctx.categories
  );

  const actions: string[] = [];
  let observation = '';

  const overBudget = summary.categories.filter((c) => c.limit > 0 && c.isOver);
  const nearLimit = summary.categories.filter(
    (c) => c.limit > 0 && !c.isOver && c.percentage >= 75
  );

  if (thisTxs.length === 0) {
    return {
      observation: 'There is not enough recent spending data to identify saving opportunities.',
      actions: ['Log a few expenses this week to unlock trend-based advice.'],
      empty: true,
    };
  }

  if (overBudget.length > 0) {
    const names = overBudget.map((c) => c.name).join(', ');
    observation = `${names} ${overBudget.length === 1 ? 'is' : 'are'} over budget this cycle.`;
    for (const cat of overBudget.slice(0, 2)) {
      actions.push(`Pause non-essential spending in ${cat.name} until the next cycle.`);
    }
  } else if (nearLimit.length > 0) {
    const cat = nearLimit.sort((a, b) => b.percentage - a.percentage)[0];
    observation = `${cat.name} is at ${cat.percentage}% of its limit with ${summary.daysLeft} days left in the cycle.`;
    actions.push(`Keep ${cat.name} spending under ${Math.max(0, Math.floor(cat.remaining / summary.daysLeft))} per day for the rest of the cycle.`);
  } else {
    const thisTotal = thisTxs.reduce((s, t) => s + t.amount, 0);
    const lastTotal = lastTxs.reduce((s, t) => s + t.amount, 0);
    if (lastTotal > 0 && thisTotal > lastTotal * 1.15) {
      const increase = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
      observation = `Your spending this month is up about ${increase}% compared to last month.`;
      actions.push('Review your largest categories in Activity and trim one discretionary area.');
    } else if (summary.safeToSpend !== null) {
      observation = `You are on track with about ${Math.floor(summary.safeToSpend)} safe to spend per day for the rest of the cycle.`;
      if (ctx.savingsGoal > 0) {
        actions.push(`Consider directing any surplus toward your savings goal of ${ctx.savingsGoal}.`);
      } else {
        actions.push('Maintain current spending pace to stay within your configured limits.');
      }
    } else {
      observation = 'Your spending is within configured limits, but safe-to-spend is not active without category limits.';
      actions.push('Set category limits on the Budget screen for daily guidance.');
    }
  }

  if (actions.length < 2 && summary.warnings.length > 0) {
    const warn = summary.warnings[0];
    actions.push(`Watch ${warn.categoryName}: ${warn.message}`);
  }

  if (actions.length === 0) {
    actions.push('Continue tracking expenses to keep your budget visibility accurate.');
  }

  return {
    observation,
    actions: actions.slice(0, 3),
    empty: false,
  };
}
