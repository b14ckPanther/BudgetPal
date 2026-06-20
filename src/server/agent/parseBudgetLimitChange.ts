/**
 * Parses budget limit change from user message via OpenAI.
 */

import { chatCompletion } from '../ai';
import { PARSE_BUDGET_LIMIT_PROMPT } from './prompts';
import { parseJsonFromAI } from './parseJson';
import { HierarchyCategory } from '../../lib/categoryHierarchy';
import { z } from 'zod';

const BudgetLimitParseRawSchema = z.object({
  operation: z.enum(['set', 'increase', 'decrease', 'move']),
  amount: z.number().positive(),
  categoryName: z.string().nullish(),
  sourceCategoryName: z.string().nullish(),
  targetCategoryName: z.string().nullish(),
  confidence: z.number().min(0).max(1),
});

export interface BudgetLimitParseResult {
  operation: 'set' | 'increase' | 'decrease' | 'move';
  amount: number;
  categoryName: string;
  sourceCategoryName?: string | null;
  targetCategoryName?: string | null;
  confidence: number;
}

function normalizeBudgetLimitParse(
  raw: z.infer<typeof BudgetLimitParseRawSchema>
): BudgetLimitParseResult {
  if (raw.operation === 'move') {
    const source = raw.sourceCategoryName?.trim();
    const target = raw.targetCategoryName?.trim();
    if (!source || !target) {
      throw new Error(
        'Move operations require sourceCategoryName and targetCategoryName'
      );
    }
    return {
      operation: 'move',
      amount: raw.amount,
      categoryName: target,
      sourceCategoryName: source,
      targetCategoryName: target,
      confidence: raw.confidence,
    };
  }

  const categoryName = raw.categoryName?.trim();
  if (!categoryName) {
    throw new Error('categoryName is required for set, increase, and decrease');
  }

  return {
    operation: raw.operation,
    amount: raw.amount,
    categoryName,
    sourceCategoryName: raw.sourceCategoryName,
    targetCategoryName: raw.targetCategoryName,
    confidence: raw.confidence,
  };
}

export async function parseBudgetLimitChange(
  message: string,
  categories: HierarchyCategory[]
): Promise<BudgetLimitParseResult> {
  const categoriesListStr = categories
    .filter((c) => c.type === 'expense' && !c.parentCategoryId)
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join('\n');

  const prompt = PARSE_BUDGET_LIMIT_PROMPT.replace('{{categoriesList}}', categoriesListStr);

  const responseText = await chatCompletion(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: message },
    ],
    { model: 'gpt-4o-mini', temperature: 0.1, responseFormat: { type: 'json_object' } }
  );

  const parsed = parseJsonFromAI(responseText);
  const raw = BudgetLimitParseRawSchema.parse(parsed);
  return normalizeBudgetLimitParse(raw);
}
