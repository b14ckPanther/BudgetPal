/**
 * Builds a validated budget limit proposal from AI parse output and user context.
 */

import { resolveCategoryTerms, HierarchyCategory } from '../../lib/categoryHierarchy';
import { calculateBudgetSummary } from '../../lib/budgets';
import { BudgetLimitProposal } from '../validation';
import { BudgetLimitParseResult } from './parseBudgetLimitChange';
import { UserAgentContext } from './loadUserContext';

export type BudgetLimitOutcome =
  | { ok: true; proposal: BudgetLimitProposal }
  | { ok: false; clarification: string };

function findLimit(ctx: UserAgentContext, categoryId: string): number {
  return ctx.limits.find((l) => l.categoryId === categoryId)?.monthlyLimit ?? 0;
}

function resolveCategoryByName(
  name: string,
  categories: HierarchyCategory[]
): HierarchyCategory | undefined {
  const res = resolveCategoryTerms([name], categories);
  if (!res.ok || res.categoryIds.length === 0) return undefined;
  const parentId = res.categoryIds.find((id) => {
    const c = categories.find((cat) => cat.id === id);
    return c && !c.parentCategoryId;
  });
  if (parentId) return categories.find((c) => c.id === parentId);
  return categories.find((c) => res.categoryIds.includes(c.id));
}

export function buildBudgetLimitProposal(
  parsed: BudgetLimitParseResult,
  ctx: UserAgentContext
): BudgetLimitOutcome {
  if (!ctx.budget) {
    return {
      ok: false,
      clarification: 'You need an active budget before changing category limits.',
    };
  }

  const summary = calculateBudgetSummary(
    ctx.budget,
    ctx.transactions,
    ctx.categories,
    ctx.limits
  );

  if (parsed.operation === 'move') {
    const sourceName = parsed.sourceCategoryName;
    const targetName = parsed.targetCategoryName;
    if (!sourceName || !targetName) {
      return {
        ok: false,
        clarification: 'Please specify both source and target categories, e.g. "move 100 from Shopping to Food & Drinks".',
      };
    }

    const source = resolveCategoryByName(sourceName, ctx.categories);
    const target = resolveCategoryByName(targetName, ctx.categories);

    if (!source || !target) {
      return {
        ok: false,
        clarification: 'I could not match both categories to your budget. Use exact category names from your Budget screen.',
      };
    }

    const sourceCurrent = findLimit(ctx, source.id);
    const targetCurrent = findLimit(ctx, target.id);

    if (sourceCurrent === 0) {
      return {
        ok: false,
        clarification: `${source.name} does not have a configured limit yet. Set a limit first before moving from it.`,
      };
    }

    const sourceProposed = sourceCurrent - parsed.amount;
    if (sourceProposed < 0) {
      return {
        ok: false,
        clarification: `Cannot move ${parsed.amount} from ${source.name} — only ${sourceCurrent} is available in that limit.`,
      };
    }

    const targetProposed = targetCurrent + parsed.amount;
    const createsNewLimit = targetCurrent === 0;

    let impactSummary = `Move ${parsed.amount} from ${source.name} (${sourceCurrent} → ${sourceProposed}) to ${target.name} (${targetCurrent} → ${targetProposed}).`;
    if (summary.safeToSpend !== null) {
      impactSummary += ` Overall planned budget stays the same; safe-to-spend per day is unchanged.`;
    }

    return {
      ok: true,
      proposal: {
        operation: 'move',
        amount: parsed.amount,
        categoryName: target.name,
        currentLimit: targetCurrent,
        proposedLimit: targetProposed,
        sourceCategoryId: source.id,
        sourceCategoryName: source.name,
        sourceCurrentLimit: sourceCurrent,
        sourceProposedLimit: sourceProposed,
        targetCategoryId: target.id,
        targetCategoryName: target.name,
        targetCurrentLimit: targetCurrent,
        targetProposedLimit: targetProposed,
        createsNewLimit,
        confidence: parsed.confidence,
        impactSummary,
      },
    };
  }

  const category = resolveCategoryByName(parsed.categoryName, ctx.categories);
  if (!category) {
    return {
      ok: false,
      clarification: `I could not find a category matching "${parsed.categoryName}". Check your category names on the Budget screen.`,
    };
  }

  const currentLimit = findLimit(ctx, category.id);
  let proposedLimit: number;

  switch (parsed.operation) {
    case 'set':
      proposedLimit = parsed.amount;
      break;
    case 'increase':
      proposedLimit = currentLimit + parsed.amount;
      break;
    case 'decrease':
      proposedLimit = Math.max(0, currentLimit - parsed.amount);
      break;
    default:
      return { ok: false, clarification: 'Unsupported budget operation.' };
  }

  const createsNewLimit = currentLimit === 0;
  const overallDelta = proposedLimit - currentLimit;
  let impactSummary = `${parsed.operation === 'set' ? 'Set' : parsed.operation === 'increase' ? 'Increase' : 'Reduce'} ${category.name} limit from ${currentLimit} to ${proposedLimit}.`;

  if (summary.safeToSpend !== null && overallDelta !== 0) {
    const newOverall = summary.overallLimit + overallDelta;
    const newSafe =
      summary.daysLeft > 0
        ? Math.max(0, (newOverall - summary.overallSpent) / summary.daysLeft)
        : 0;
    impactSummary += ` Estimated safe-to-spend: ${Math.floor(summary.safeToSpend)} → ${Math.floor(newSafe)} per day.`;
  }

  return {
    ok: true,
    proposal: {
      operation: parsed.operation,
      amount: parsed.amount,
      categoryId: category.id,
      categoryName: category.name,
      currentLimit,
      proposedLimit,
      createsNewLimit,
      confidence: parsed.confidence,
      impactSummary,
    },
  };
}
