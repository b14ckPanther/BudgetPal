/**
 * BudgetPal — API & Data Type Definitions
 * Types for transactions, categories, budgets, profiles, receipts, voice entries.
 */

// ── Transaction ──────────────────────────────────────────

export type TransactionType = 'expense' | 'income' | 'transfer';

export type TransactionSource = 'manual' | 'text' | 'voice' | 'receipt' | 'agent' | 'import';

export type TransactionStatus = 'pending_review' | 'confirmed' | 'rejected' | 'duplicate' | 'deleted';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  merchant: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  date: string;
  source: TransactionSource;
  confidence: number;
  status: TransactionStatus;
  receiptId?: string;
  voiceEntryId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Category ─────────────────────────────────────────────

export type CategoryType = 'expense' | 'income' | 'savings' | 'transfer';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  parentCategoryId?: string;
  monthlyLimit: number;
  spent: number;
  aiCreated: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Budget ───────────────────────────────────────────────

export type BudgetStyle = 'strict' | 'balanced' | 'chill';

export interface Budget {
  id: string;
  userId: string;
  name: string;
  currency: string;
  monthlyIncome: number;
  startingBalance: number;
  cycleStartDay: number;
  savingsGoal: number;
  budgetStyle: BudgetStyle;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Profile ──────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string;
  preferredLanguage: string;
  currency: string;
  budgetStyle: BudgetStyle;
  monthlyIncome: number;
  startingBalance: number;
  budgetCycleStartDay: number;
  mainFinancialGoal: string;
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Receipt ──────────────────────────────────────────────

export interface Receipt {
  id: string;
  userId: string;
  fileUrl: string;
  merchant: string;
  receiptDate: string;
  totalAmount: number;
  currency: string;
  extractedItems: ReceiptItem[];
  confidence: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

// ── Voice Entry ──────────────────────────────────────────

export interface VoiceEntry {
  id: string;
  userId: string;
  audioUrl: string;
  transcription: string;
  interpretedPayload: Record<string, unknown>;
  confidence: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Report ───────────────────────────────────────────────

export type ReportType = 'weekly' | 'monthly' | 'custom' | 'category' | 'merchant' | 'trend';

export interface Report {
  id: string;
  userId: string;
  title: string;
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  summary: string;
  metrics: ReportMetrics;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryBreakdown: CategoryBreakdown[];
  topMerchants: MerchantSummary[];
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
  percentage: number;
  limit: number;
  isOverBudget: boolean;
}

export interface MerchantSummary {
  name: string;
  totalAmount: number;
  transactionCount: number;
}
