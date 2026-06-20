/**
 * Parses spending analysis query spec from user message via OpenAI.
 */

import { chatCompletion } from '../ai';
import { PARSE_SPENDING_QUERY_PROMPT } from './prompts';
import { SpendingQuerySpec, SpendingQuerySpecSchema } from '../validation';
import { HierarchyCategory } from '../../lib/categoryHierarchy';
import { parseJsonFromAI } from './parseJson';

export async function parseSpendingQuery(
  message: string,
  context: { today: string; categories: HierarchyCategory[] }
): Promise<SpendingQuerySpec> {
  const categoriesListStr = context.categories
    .map((c) => {
      const parent = c.parentCategoryId
        ? context.categories.find((p) => p.id === c.parentCategoryId)
        : null;
      return `- ${c.name}${parent ? ` (parent: ${parent.name})` : ''}`;
    })
    .join('\n');

  const prompt = PARSE_SPENDING_QUERY_PROMPT
    .replace('{{today}}', context.today)
    .replace('{{categoriesList}}', categoriesListStr);

  const responseText = await chatCompletion(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: message },
    ],
    { model: 'gpt-4o-mini', temperature: 0.1, responseFormat: { type: 'json_object' } }
  );

  const parsed = parseJsonFromAI(responseText);
  return SpendingQuerySpecSchema.parse(parsed);
}
