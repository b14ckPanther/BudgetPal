/**
 * BudgetPal — Agent Transaction Parsing
 * Parses transaction details from user input using OpenAI and matches to user categories.
 */

import { chatCompletion } from '../ai';
import { PARSE_TRANSACTION_SYSTEM_PROMPT } from './prompts';
import { TransactionProposal, TransactionProposalSchema } from '../validation';
import {
  HierarchyCategory,
  resolveCategoryAssignment,
  sanitizeMerchant,
} from '../../lib/categoryHierarchy';

export type UserCategory = HierarchyCategory;

export async function parseTransaction(
  message: string,
  context: {
    today: string;
    currency: string;
    categories: UserCategory[];
  }
): Promise<TransactionProposal> {
  const categoriesListStr = context.categories
    .map((c) => {
      const parent = c.parentCategoryId
        ? context.categories.find((p) => p.id === c.parentCategoryId)
        : null;
      const parentLabel = parent ? `, parent: ${parent.name}` : '';
      return `- ${c.name} (type: ${c.type}, id: ${c.id}${parentLabel})`;
    })
    .join('\n');

  const prompt = PARSE_TRANSACTION_SYSTEM_PROMPT
    .replace('{{today}}', context.today)
    .replace('{{currency}}', context.currency)
    .replace(/\{\{currency\}\}/g, context.currency)
    .replace('{{categoriesList}}', categoriesListStr);

  const messages = [
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: message },
  ];

  try {
    const responseText = await chatCompletion(messages, {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      responseFormat: { type: 'json_object' },
    });

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }

    const parsed = JSON.parse(cleanedText);
    const validated = TransactionProposalSchema.parse(parsed);

    const resolved = resolveCategoryAssignment(
      context.categories,
      validated.categoryName,
      validated.subcategoryName ?? undefined,
      validated.type,
      validated.categoryId ?? undefined,
      validated.subcategoryId ?? undefined
    );

    validated.categoryId = resolved.categoryId;
    validated.categoryName = resolved.categoryName;
    validated.subcategoryId = resolved.subcategoryId;
    validated.subcategoryName = resolved.subcategoryName;

    validated.merchant = sanitizeMerchant(validated.merchant ?? undefined) ?? undefined;
    validated.title = validated.title?.trim() || 'Transaction';

    return validated;
  } catch (error) {
    console.error('Error parsing transaction:', error);

    const defaultCat = context.categories.find((c) => c.type === 'expense') || context.categories[0];
    return {
      type: 'expense',
      amount: 0.01,
      currency: context.currency,
      title: 'Failed to parse transaction details',
      categoryId: defaultCat?.id,
      categoryName: defaultCat?.name || 'Uncategorized',
      date: context.today,
      confidence: 0.1,
      note: 'Parsing error occurred.',
    };
  }
}
