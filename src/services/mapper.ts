import { Database } from '../types/database';
import { Profile, Budget, Category, Transaction, Receipt, VoiceEntry, Report, ReceiptItem, ReportMetrics } from '../types/api';
import { AgentMessage, AgentAction, AgentIntent, AgentActionType, ActionStatus } from '../types/agent';

type DBProfile = Database['public']['Tables']['profiles']['Row'];
type DBBudget = Database['public']['Tables']['budgets']['Row'];
type DBCategory = Database['public']['Tables']['categories']['Row'];
type DBTransaction = Database['public']['Tables']['transactions']['Row'];
type DBReceipt = Database['public']['Tables']['receipts']['Row'];
type DBVoiceEntry = Database['public']['Tables']['voice_entries']['Row'];
type DBReport = Database['public']['Tables']['reports']['Row'];
type DBAgentMessage = Database['public']['Tables']['agent_messages']['Row'];
type DBAgentAction = Database['public']['Tables']['agent_actions']['Row'];

export function mapProfile(db: DBProfile): Profile {
  return {
    id: db.id,
    email: db.email || '',
    username: db.username || undefined,
    firstName: db.first_name || '',
    lastName: db.last_name || '',
    displayName: db.display_name || '',
    dateOfBirth: db.date_of_birth || '',
    preferredLanguage: db.preferred_language,
    currency: db.currency,
    budgetStyle: db.budget_style as 'strict' | 'balanced' | 'chill',
    monthlyIncome: db.monthly_income ? Number(db.monthly_income) : 0,
    startingBalance: db.starting_balance ? Number(db.starting_balance) : 0,
    budgetCycleStartDay: db.budget_cycle_start_day,
    mainFinancialGoal: db.main_financial_goal || '',
    onboardingCompleted: db.onboarding_completed,
    notificationsEnabled: db.notifications_enabled,
    agentVoiceRepliesEnabled: db.agent_voice_replies_enabled ?? false,
    themePreference: (db.theme_preference as 'dark' | 'light') || 'dark',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapBudget(db: DBBudget): Budget {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    currency: db.currency,
    monthlyIncome: db.monthly_income ? Number(db.monthly_income) : 0,
    startingBalance: db.starting_balance ? Number(db.starting_balance) : 0,
    cycleStartDay: db.cycle_start_day,
    savingsGoal: db.savings_goal ? Number(db.savings_goal) : 0,
    budgetStyle: db.budget_style as 'strict' | 'balanced' | 'chill',
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapCategory(db: DBCategory, spent = 0): Category {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    type: db.type as 'expense' | 'income' | 'savings' | 'transfer',
    parentCategoryId: db.parent_category_id || undefined,
    monthlyLimit: db.monthly_limit ? Number(db.monthly_limit) : 0,
    spent,
    aiCreated: db.ai_created,
    isDefault: db.is_default,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapTransaction(
  db: DBTransaction,
  categoryName = 'Uncategorized',
  subcategoryName?: string
): Transaction {
  return {
    id: db.id,
    userId: db.user_id,
    amount: Number(db.amount),
    currency: db.currency,
    type: db.type as 'expense' | 'income' | 'transfer',
    merchant: db.merchant || '',
    title: db.title || '',
    description: db.description || undefined,
    categoryId: db.category_id || '',
    categoryName,
    subcategoryId: db.subcategory_id || undefined,
    subcategoryName,
    date: db.date,
    source: db.source as 'manual' | 'text' | 'voice' | 'receipt' | 'agent' | 'import',
    confidence: db.confidence ? Number(db.confidence) : 1.0,
    status: db.status as 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted',
    receiptId: db.receipt_id || undefined,
    voiceEntryId: db.voice_entry_id || undefined,
    note: db.note || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapReceipt(db: DBReceipt): Receipt {
  return {
    id: db.id,
    userId: db.user_id,
    fileUrl: db.file_url || '',
    merchant: db.merchant || '',
    receiptDate: db.receipt_date || '',
    totalAmount: db.total_amount ? Number(db.total_amount) : 0,
    currency: db.currency,
    extractedItems: (db.extracted_items as unknown as ReceiptItem[]) || [],
    confidence: db.confidence ? Number(db.confidence) : 1.0,
    status: db.status as 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapVoiceEntry(db: DBVoiceEntry): VoiceEntry {
  return {
    id: db.id,
    userId: db.user_id,
    audioUrl: db.audio_url || '',
    transcription: db.transcription || '',
    interpretedPayload: (db.interpreted_payload as Record<string, unknown>) || {},
    confidence: db.confidence ? Number(db.confidence) : 1.0,
    status: db.status as 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapReport(db: DBReport): Report {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    type: db.type as Report['type'],
    dateFrom: db.date_from || '',
    dateTo: db.date_to || '',
    summary: db.summary || '',
    metrics: (db.metrics as unknown as ReportMetrics) || {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      categoryBreakdown: [],
      topMerchants: [],
    },
    status: (db.status as Report['status']) || 'ready',
    hasPdf: !!db.file_url && db.status === 'ready',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapAgentMessage(db: DBAgentMessage): AgentMessage {
  // Extract cards and suggestedPrompts from metadata
  const metadata = (db.metadata as Record<string, unknown>) || {};
  const cards = Array.isArray(metadata.cards) ? metadata.cards : undefined;
  const suggestedPrompts = Array.isArray(metadata.suggestedPrompts) ? metadata.suggestedPrompts : undefined;
  
  return {
    id: db.id,
    role: db.role as 'user' | 'agent',
    content: db.content,
    intent: db.intent ? (db.intent as AgentIntent) : undefined,
    confidence: db.confidence ? Number(db.confidence) : undefined,
    cards: cards,
    suggestedPrompts: suggestedPrompts,
    createdAt: db.created_at,
  };
}

export function mapAgentAction(db: DBAgentAction): AgentAction {
  return {
    id: db.id,
    type: db.action_type as AgentActionType,
    payload: (db.payload as Record<string, unknown>) || {},
    status: db.status as ActionStatus,
    confidence: db.confidence ? Number(db.confidence) : 1.0,
    requiresConfirmation: db.requires_confirmation,
  };
}
