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

export type TransactionParseErrorCode = 'invalid_amount' | 'invalid_proposal' | 'parse_failed';

export class TransactionParseError extends Error {
  readonly code: TransactionParseErrorCode;

  constructor(message: string, code: TransactionParseErrorCode) {
    super(message);
    this.name = 'TransactionParseError';
    this.code = code;
  }
}

function validationErrorCode(error: { issues: Array<{ path: PropertyKey[] }> }): TransactionParseErrorCode {
  const hasAmountIssue = error.issues.some((issue) => issue.path[0] === 'amount');
  return hasAmountIssue ? 'invalid_amount' : 'invalid_proposal';
}

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
    const validated = TransactionProposalSchema.safeParse(parsed);

    if (!validated.success) {
      throw new TransactionParseError(
        'Transaction proposal failed validation.',
        validationErrorCode(validated.error)
      );
    }

    const proposal = validated.data;

    const resolved = resolveCategoryAssignment(
      context.categories,
      proposal.categoryName,
      proposal.subcategoryName ?? undefined,
      proposal.type,
      proposal.categoryId ?? undefined,
      proposal.subcategoryId ?? undefined
    );

    proposal.categoryId = resolved.categoryId;
    proposal.categoryName = resolved.categoryName;
    proposal.subcategoryId = resolved.subcategoryId;
    proposal.subcategoryName = resolved.subcategoryName;

    proposal.merchant = sanitizeMerchant(proposal.merchant ?? undefined) ?? undefined;
    proposal.title = proposal.title?.trim() || 'Transaction';

    return proposal;
  } catch (error) {
    if (error instanceof TransactionParseError) {
      throw error;
    }

    console.error('Error parsing transaction:', error);
    throw new TransactionParseError('Failed to parse transaction from message.', 'parse_failed');
  }
}
