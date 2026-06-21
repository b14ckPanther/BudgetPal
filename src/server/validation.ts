/**
 * BudgetPal — Server-Side Validation Schemas
 * Zod schemas for validating AI outputs and API request/response payloads.
 */

import { z } from 'zod';

// ── Agent Intent ─────────────────────────────────────────
export const AgentIntentSchema = z.enum([
  'casual_greeting',
  'app_guidance',
  'add_transaction',
  'ask_spending_analysis',
  'ask_affordability',
  'ask_saving_advice',
  'update_budget_limit',
  'move_budget_limit',
  'generate_report',
  'unclear',
  'out_of_scope',
]);

export type AgentIntentType = z.infer<typeof AgentIntentSchema>;

// ── Intent Classification Result ─────────────────────────
export const IntentClassificationSchema = z.object({
  intent: AgentIntentSchema,
  confidence: z.number().min(0).max(1),
  message: z.string(),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// ── Transaction Proposal ─────────────────────────────────
export const TransactionProposalSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number().positive(),
  currency: z.string().default('ILS'),
  merchant: z.string().nullish(),
  title: z.string(),
  categoryId: z.string().nullish(),
  categoryName: z.string(),
  subcategoryId: z.string().nullish(),
  subcategoryName: z.string().nullish(),
  date: z.string(),
  confidence: z.number().min(0).max(1),
  note: z.string().nullish(),
});

export type TransactionProposal = z.infer<typeof TransactionProposalSchema>;

// ── Spending Analysis Query Spec ─────────────────────────
export const DateRangePresetSchema = z.enum([
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'last_3_months',
  'last_8_months',
  'this_year',
  'custom',
  'semester',
]);

export const SpendingAnalysisTypeSchema = z.enum([
  'top_categories',
  'category_breakdown',
  'single_category',
  'merchant_breakdown',
  'category_comparison',
  'category_growth',
]);

export const SpendingQuerySpecSchema = z.object({
  analysisType: SpendingAnalysisTypeSchema,
  dateRangePreset: DateRangePresetSchema,
  customStart: z.string().nullish(),
  customEnd: z.string().nullish(),
  categoryTerms: z.array(z.string()).default([]),
  merchantTerms: z.array(z.string()).default([]),
  compareToPreviousPeriod: z.boolean().default(false),
  confidence: z.number().min(0).max(1),
});

export type SpendingQuerySpec = z.infer<typeof SpendingQuerySpecSchema>;

// ── Affordability Request Spec ───────────────────────────
export const AffordabilityRequestSchema = z.object({
  amount: z.number().positive(),
  itemLabel: z.string().nullish(),
  categoryTerm: z.string().nullish(),
  confidence: z.number().min(0).max(1),
});

export type AffordabilityRequestSpec = z.infer<typeof AffordabilityRequestSchema>;

// ── Budget Limit Proposal ──────────────────────────────────
export const BudgetLimitOperationSchema = z.enum(['set', 'increase', 'decrease', 'move']);

export const BudgetLimitProposalSchema = z.object({
  operation: BudgetLimitOperationSchema,
  amount: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string(),
  currentLimit: z.number().min(0).default(0),
  proposedLimit: z.number().min(0),
  sourceCategoryId: z.string().uuid().optional(),
  sourceCategoryName: z.string().nullish(),
  sourceCurrentLimit: z.number().min(0).optional(),
  sourceProposedLimit: z.number().min(0).optional(),
  targetCategoryId: z.string().uuid().optional(),
  targetCategoryName: z.string().nullish(),
  targetCurrentLimit: z.number().min(0).optional(),
  targetProposedLimit: z.number().min(0).optional(),
  createsNewLimit: z.boolean().default(false),
  confidence: z.number().min(0).max(1),
  impactSummary: z.string().nullish(),
});

export type BudgetLimitProposal = z.infer<typeof BudgetLimitProposalSchema>;

// ── Confirm Action Request ───────────────────────────────
export const TransactionProposalOverrideSchema = TransactionProposalSchema.partial();

export const ConfirmActionSchema = z.object({
  actionId: z.string().uuid(),
  action: z.enum(['confirm', 'cancel']),
  overrides: TransactionProposalOverrideSchema.optional(),
});

export type ConfirmActionRequest = z.infer<typeof ConfirmActionSchema>;

// ── Agent Message Request ────────────────────────────────
export const AgentMessageRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

export type AgentMessageRequest = z.infer<typeof AgentMessageRequestSchema>;

// ── Receipt extraction ───────────────────────────────────
export const ReceiptLineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
});

export const ReceiptExtractionSchema = z.object({
  merchant: z.string().nullable(),
  receiptDate: z.string().nullable(),
  totalAmount: z.number().positive().nullable(),
  currency: z.string().default('ILS'),
  lineItems: z.array(ReceiptLineItemSchema).default([]),
  suggestedCategoryName: z.string(),
  suggestedSubcategoryName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  uncertaintyNotes: z.string().nullable(),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

// ── Card payload helpers ───────────────────────────────────
export const AffordabilityVerdictSchema = z.enum([
  'safe',
  'caution',
  'not_recommended',
  'need_budget_setup',
]);

export type AffordabilityVerdict = z.infer<typeof AffordabilityVerdictSchema>;

// ── Report generation ──────────────────────────────────────
export const ReportTypeSchema = z.enum([
  'weekly',
  'monthly',
  'custom',
  'category',
  'merchant',
  'trend',
]);

export const ReportGenerateRequestSchema = z.object({
  type: ReportTypeSchema,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categoryTerms: z.array(z.string()).optional(),
  merchantTerms: z.array(z.string()).optional(),
  comparePrevious: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  idempotencyKey: z.string().uuid(),
});

export type ReportGenerateRequest = z.infer<typeof ReportGenerateRequestSchema>;

export const ReportNarrativeOutputSchema = z.object({
  summary: z.string().min(1).max(600),
  recommendations: z.array(z.string().min(1).max(200)).min(1).max(3),
});
