export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          first_name: string | null
          last_name: string | null
          display_name: string | null
          date_of_birth: string | null
          preferred_language: string
          currency: string
          budget_style: string
          monthly_income: number | null
          starting_balance: number | null
          budget_cycle_start_day: number
          main_financial_goal: string | null
          onboarding_completed: boolean
          notifications_enabled: boolean
          agent_voice_replies_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          date_of_birth?: string | null
          preferred_language?: string
          currency?: string
          budget_style?: string
          monthly_income?: number | null
          starting_balance?: number | null
          budget_cycle_start_day?: number
          main_financial_goal?: string | null
          onboarding_completed?: boolean
          notifications_enabled?: boolean
          agent_voice_replies_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          date_of_birth?: string | null
          preferred_language?: string
          currency?: string
          budget_style?: string
          monthly_income?: number | null
          starting_balance?: number | null
          budget_cycle_start_day?: number
          main_financial_goal?: string | null
          onboarding_completed?: boolean
          notifications_enabled?: boolean
          agent_voice_replies_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          currency: string
          monthly_income: number | null
          starting_balance: number | null
          cycle_start_day: number
          savings_goal: number | null
          budget_style: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          currency?: string
          monthly_income?: number | null
          starting_balance?: number | null
          cycle_start_day?: number
          savings_goal?: number | null
          budget_style?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          currency?: string
          monthly_income?: number | null
          starting_balance?: number | null
          cycle_start_day?: number
          savings_goal?: number | null
          budget_style?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          parent_category_id: string | null
          monthly_limit: number | null
          ai_created: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          parent_category_id?: string | null
          monthly_limit?: number | null
          ai_created?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          parent_category_id?: string | null
          monthly_limit?: number | null
          ai_created?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_category_limits: {
        Row: {
          id: string
          user_id: string
          budget_id: string
          category_id: string
          monthly_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_id: string
          category_id: string
          monthly_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string
          category_id?: string
          monthly_limit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          type: string
          merchant: string | null
          title: string | null
          description: string | null
          category_id: string | null
          subcategory_id: string | null
          date: string
          source: string
          confidence: number | null
          status: string
          receipt_id: string | null
          voice_entry_id: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          type: string
          merchant?: string | null
          title?: string | null
          description?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          date?: string
          source?: string
          confidence?: number | null
          status?: string
          receipt_id?: string | null
          voice_entry_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          type?: string
          merchant?: string | null
          title?: string | null
          description?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          date?: string
          source?: string
          confidence?: number | null
          status?: string
          receipt_id?: string | null
          voice_entry_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          file_url: string | null
          merchant: string | null
          receipt_date: string | null
          total_amount: number | null
          currency: string
          extracted_items: Json
          confidence: number | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_url?: string | null
          merchant?: string | null
          receipt_date?: string | null
          total_amount?: number | null
          currency?: string
          extracted_items?: Json
          confidence?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string | null
          merchant?: string | null
          receipt_date?: string | null
          total_amount?: number | null
          currency?: string
          extracted_items?: Json
          confidence?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      voice_entries: {
        Row: {
          id: string
          user_id: string
          audio_url: string | null
          transcription: string | null
          interpreted_payload: Json
          confidence: number | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          audio_url?: string | null
          transcription?: string | null
          interpreted_payload?: Json
          confidence?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          audio_url?: string | null
          transcription?: string | null
          interpreted_payload?: Json
          confidence?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          intent: string | null
          confidence: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          intent?: string | null
          confidence?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          intent?: string | null
          confidence?: number | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          id: string
          user_id: string
          message_id: string | null
          action_type: string
          payload: Json
          status: string
          confidence: number | null
          requires_confirmation: boolean
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id?: string | null
          action_type: string
          payload?: Json
          status?: string
          confidence?: number | null
          requires_confirmation?: boolean
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string | null
          action_type?: string
          payload?: Json
          status?: string
          confidence?: number | null
          requires_confirmation?: boolean
          executed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          user_id: string
          title: string
          type: string
          date_from: string | null
          date_to: string | null
          summary: string | null
          metrics: Json
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          type: string
          date_from?: string | null
          date_to?: string | null
          summary?: string | null
          metrics?: Json
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          type?: string
          date_from?: string | null
          date_to?: string | null
          summary?: string | null
          metrics?: Json
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      warnings: {
        Row: {
          id: string
          user_id: string
          budget_id: string | null
          category_id: string | null
          level: string
          title: string
          message: string
          status: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_id?: string | null
          category_id?: string | null
          level: string
          title: string
          message: string
          status?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string | null
          category_id?: string | null
          level?: string
          title?: string
          message?: string
          status?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_initial_budget_for_user: {
        Args: {
          target_user_id: string
          p_name?: string
          p_currency?: string
          p_cycle_start_day?: number
          p_budget_style?: string
        }
        Returns: string
      }
      create_default_categories_for_user: {
        Args: {
          target_user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
