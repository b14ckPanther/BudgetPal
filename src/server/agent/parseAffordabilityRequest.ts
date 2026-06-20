/**
 * Parses affordability request from user message via OpenAI.
 */

import { chatCompletion } from '../ai';
import { PARSE_AFFORDABILITY_PROMPT } from './prompts';
import { AffordabilityRequestSchema } from '../validation';
import { parseJsonFromAI } from './parseJson';

export async function parseAffordabilityRequest(message: string) {
  const responseText = await chatCompletion(
    [
      { role: 'system', content: PARSE_AFFORDABILITY_PROMPT },
      { role: 'user', content: message },
    ],
    { model: 'gpt-4o-mini', temperature: 0.1, responseFormat: { type: 'json_object' } }
  );

  const parsed = parseJsonFromAI(responseText);
  return AffordabilityRequestSchema.parse(parsed);
}
