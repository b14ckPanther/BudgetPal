/**
 * BudgetPal — Server-Side OpenAI Client
 * Initializes OpenAI with server-only API key. Never exposed to mobile client.
 */

import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

/**
 * Run a chat completion with the specified model.
 * Defaults to gpt-4o-mini for cost efficiency.
 */
export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: OpenAI.ChatCompletionCreateParams['response_format'];
  }
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 500,
    response_format: options?.responseFormat,
  });

  return response.choices[0]?.message?.content || '';
}
