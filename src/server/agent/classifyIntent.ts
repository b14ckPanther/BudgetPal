/**
 * BudgetPal — Agent Intent Classification
 * Classifies user messages using OpenAI.
 */

import { chatCompletion } from '../ai';
import { INTENT_SYSTEM_PROMPT } from './prompts';
import { IntentClassification, IntentClassificationSchema } from '../validation';
import { AgentLanguage, getLanguageInstruction } from './language';

export async function classifyIntent(
  message: string,
  context: { today: string; userName: string; language?: AgentLanguage }
): Promise<IntentClassification> {
  const prompt = INTENT_SYSTEM_PROMPT
    .replace('{{today}}', context.today)
    .replace('{{userName}}', context.userName || 'User')
    .replace('{{languageInstruction}}', getLanguageInstruction(context.language || 'en'));

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

    // Clean up response if there are markdown code blocks
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }

    const parsed = JSON.parse(cleanedText);
    const validated = IntentClassificationSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error classifying intent:', error);
    // Return a safe fallback if classification fails
    return {
      intent: 'unclear',
      confidence: 0.5,
      message: "I'm not sure I understood that. Could you please specify if you'd like to add a transaction?",
    };
  }
}
