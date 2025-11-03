/// Update this URL to point at the deployed Firebase Cloud Function that
/// processes invoice images and returns transaction suggestions.
const String aiInvoiceFunctionUrl = String.fromEnvironment(
  'AI_INVOICE_URL',
  defaultValue: '',
);

/// Configure which large language model provider powers the in-app assistant.
/// Supported values: `knowledge`, `openai`, `gemini`.
const String assistantAiProvider = String.fromEnvironment(
  'ASSISTANT_AI_PROVIDER',
  defaultValue: 'knowledge',
);

/// API key injected via --dart-define for OpenAI powered chat responses.
const String openAiApiKey = String.fromEnvironment(
  'OPENAI_API_KEY',
  defaultValue: '',
);

/// Override the OpenAI chat model. Defaults to the lightweight `gpt-4o-mini`.
const String openAiModel = String.fromEnvironment(
  'OPENAI_MODEL',
  defaultValue: 'gpt-4o-mini',
);

/// API key injected via --dart-define for Google Gemini powered chat responses.
const String geminiApiKey = String.fromEnvironment(
  'GEMINI_API_KEY',
  defaultValue: '',
);

/// Override the Gemini model. Defaults to the fast `gemini-1.5-flash`.
const String geminiModel = String.fromEnvironment(
  'GEMINI_MODEL',
  defaultValue: 'gemini-1.5-flash',
);

/// Configure which AI provider powers invoice parsing.
/// Supported values: `knowledge`, `openai`, `gemini`.
const String invoiceAiProvider = String.fromEnvironment(
  'INVOICE_AI_PROVIDER',
  defaultValue: 'gemini',
);

/// Optional override for the OpenAI model used during invoice parsing.
const String openAiVisionModel = String.fromEnvironment(
  'OPENAI_VISION_MODEL',
  defaultValue: openAiModel,
);
