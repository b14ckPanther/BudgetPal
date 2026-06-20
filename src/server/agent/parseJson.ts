/**
 * Shared helper to parse OpenAI JSON responses.
 */

export function parseJsonFromAI(responseText: string): unknown {
  let cleanedText = responseText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleanedText);
}
