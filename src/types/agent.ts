/**
 * BudgetPal — Agent Type Definitions
 * Types for agent intents, cards, actions, and responses.
 */

export type AgentIntent =
  | 'casual_greeting'
  | 'app_guidance'
  | 'add_transaction'
  | 'update_transaction'
  | 'delete_transaction'
  | 'scan_receipt'
  | 'voice_transaction'
  | 'ask_budget_summary'
  | 'ask_spending_analysis'
  | 'ask_saving_advice'
  | 'ask_affordability'
  | 'update_budget_limit'
  | 'update_budget_cycle'
  | 'create_category'
  | 'merge_categories'
  | 'generate_report'
  | 'explain_warning'
  | 'unclear'
  | 'out_of_scope';

export type AgentActionType =
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'CREATE_CATEGORY'
  | 'MERGE_CATEGORIES'
  | 'UPDATE_BUDGET_LIMIT'
  | 'MOVE_BUDGET_LIMIT'
  | 'UPDATE_BUDGET_CYCLE'
  | 'GENERATE_REPORT'
  | 'SCAN_RECEIPT'
  | 'TRANSCRIBE_VOICE'
  | 'CREATE_WARNING';

export type AgentCardType =
  | 'transaction_preview'
  | 'receipt_preview'
  | 'voice_preview'
  | 'spending_analysis'
  | 'budget_warning'
  | 'affordability'
  | 'saving_advice'
  | 'budget_limit_proposal'
  | 'report'
  | 'confirmation';

export type ActionStatus =
  | 'proposed'
  | 'confirmed'
  | 'executed'
  | 'cancelled'
  | 'failed';

export interface AgentCard {
  type: AgentCardType;
  title: string;
  data: Record<string, unknown>;
}

export interface AgentAction {
  id: string;
  type: AgentActionType;
  payload: Record<string, unknown>;
  status: ActionStatus;
  confidence: number;
  requiresConfirmation: boolean;
}

export interface AgentResponse {
  message: string;
  intent: AgentIntent;
  confidence: number;
  cards?: AgentCard[];
  actions?: AgentAction[];
  suggestedPrompts?: string[];
  warnings?: AgentWarning[];
  requiresUserChoice?: boolean;
}

export interface AgentWarning {
  id: string;
  level: 'info' | 'attention' | 'warning' | 'critical';
  title: string;
  message: string;
  category?: string;
  actionable?: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  intent?: AgentIntent;
  confidence?: number;
  cards?: AgentCard[];
  suggestedPrompts?: string[];
  createdAt: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
}
