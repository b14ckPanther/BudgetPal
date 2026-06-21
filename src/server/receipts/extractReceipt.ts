/**
 * Vision-based receipt extraction (server-only).
 */

import { getClient } from '../ai';
import { RECEIPT_VISION_MODEL } from './receiptConfig';
import { RECEIPT_EXTRACTION_SYSTEM_PROMPT } from './prompts';
import { ReceiptExtractionSchema, ReceiptExtraction } from '../validation';
import { HierarchyCategory } from '../../lib/categoryHierarchy';

function buildCategoriesList(categories: HierarchyCategory[]): string {
  return categories
    .map((c) => {
      const parent = c.parentCategoryId
        ? categories.find((p) => p.id === c.parentCategoryId)
        : null;
      const parentLabel = parent ? `, parent: ${parent.name}` : '';
      return `- ${c.name} (type: ${c.type}, id: ${c.id}${parentLabel})`;
    })
    .join('\n');
}

export async function extractReceiptFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  context: {
    today: string;
    currency: string;
    categories: HierarchyCategory[];
  }
): Promise<ReceiptExtraction> {
  const client = getClient();
  const categoriesList = buildCategoriesList(context.categories);
  const systemPrompt = RECEIPT_EXTRACTION_SYSTEM_PROMPT.replace('{{today}}', context.today)
    .replace('{{currency}}', context.currency)
    .replace('{{categoriesList}}', categoriesList);

  const dataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const response = await client.chat.completions.create({
    model: RECEIPT_VISION_MODEL,
    temperature: 0.1,
    max_tokens: 900,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract receipt data from this image.' },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not read this receipt. Please try a clearer photo or enter the details manually.');
  }

  const validated = ReceiptExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('Could not read this receipt. Please try a clearer photo or enter the details manually.');
  }

  return validated.data;
}
