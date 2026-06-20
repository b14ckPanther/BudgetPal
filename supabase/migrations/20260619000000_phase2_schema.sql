-- ==========================================
-- BUDGETPAL DATABASE SCHEMA MIGRATION (PHASE 2)
-- ==========================================

-- ── 1. Helper trigger function for updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Profiles Table ──
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  display_name text,
  date_of_birth date,
  preferred_language text DEFAULT 'en',
  currency text DEFAULT 'ILS',
  budget_style text DEFAULT 'balanced' CONSTRAINT check_budget_style CHECK (budget_style IN ('strict', 'balanced', 'chill')),
  monthly_income numeric,
  starting_balance numeric,
  budget_cycle_start_day integer DEFAULT 1 CONSTRAINT check_budget_cycle_start_day CHECK (budget_cycle_start_day BETWEEN 1 AND 31),
  main_financial_goal text,
  onboarding_completed boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 3. Budgets Table ──
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  name text DEFAULT 'Main Budget',
  currency text DEFAULT 'ILS',
  monthly_income numeric,
  starting_balance numeric,
  cycle_start_day integer DEFAULT 1 CONSTRAINT check_cycle_start_day CHECK (cycle_start_day BETWEEN 1 AND 31),
  savings_goal numeric,
  budget_style text DEFAULT 'balanced' CONSTRAINT check_budget_style CHECK (budget_style IN ('strict', 'balanced', 'chill')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 4. Categories Table ──
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  name text NOT null,
  type text NOT null CONSTRAINT check_category_type CHECK (type IN ('expense', 'income', 'savings', 'transfer')),
  parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET null,
  monthly_limit numeric,
  ai_created boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 5. Budget Category Limits Table ──
CREATE TABLE public.budget_category_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT null,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT null,
  monthly_limit numeric NOT null DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 6. Transactions Table ──
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  amount numeric NOT null,
  currency text DEFAULT 'ILS',
  type text NOT null CONSTRAINT check_transaction_type CHECK (type IN ('expense', 'income', 'transfer')),
  merchant text,
  title text,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET null,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET null,
  date date NOT null DEFAULT current_date,
  source text NOT null DEFAULT 'manual' CONSTRAINT check_transaction_source CHECK (source IN ('manual', 'text', 'voice', 'receipt', 'agent', 'import')),
  confidence numeric,
  status text NOT null DEFAULT 'confirmed' CONSTRAINT check_transaction_status CHECK (status IN ('pending_review', 'confirmed', 'rejected', 'duplicate', 'deleted')),
  receipt_id uuid,
  voice_entry_id uuid,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 7. Receipts Table ──
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  file_url text,
  merchant text,
  receipt_date date,
  total_amount numeric,
  currency text DEFAULT 'ILS',
  extracted_items jsonb DEFAULT '[]'::jsonb,
  confidence numeric,
  status text DEFAULT 'pending_review',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 8. Voice Entries Table ──
CREATE TABLE public.voice_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  audio_url text,
  transcription text,
  interpreted_payload jsonb DEFAULT '{}'::jsonb,
  confidence numeric,
  status text DEFAULT 'pending_review',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 9. FK Constraints Linkage ──
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_receipt FOREIGN KEY (receipt_id) REFERENCES public.receipts(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_voice_entry FOREIGN KEY (voice_entry_id) REFERENCES public.voice_entries(id) ON DELETE SET NULL;

-- ── 10. Agent Messages Table ──
CREATE TABLE public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  role text NOT null,
  content text NOT null,
  intent text,
  confidence numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── 11. Agent Actions Table ──
CREATE TABLE public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET null,
  action_type text NOT null,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT null DEFAULT 'proposed' CONSTRAINT check_agent_action_status CHECK (status IN ('proposed', 'confirmed', 'executed', 'cancelled', 'failed')),
  confidence numeric,
  requires_confirmation boolean DEFAULT true,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── 12. Reports Table ──
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  title text NOT null,
  type text NOT null,
  date_from date,
  date_to date,
  summary text,
  metrics jsonb DEFAULT '{}'::jsonb,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 13. Warnings Table ──
CREATE TABLE public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET null,
  level text NOT null CONSTRAINT check_warning_level CHECK (level IN ('info', 'success', 'warning', 'risk', 'danger')),
  title text NOT null,
  message text NOT null,
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 14. Budget Events Table ──
CREATE TABLE public.budget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT null,
  event_type text NOT null,
  entity_type text,
  entity_id uuid,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── 15. Apply updated_at Automation Triggers ──
CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_budget_category_limits_updated_at BEFORE UPDATE ON public.budget_category_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_voice_entries_updated_at BEFORE UPDATE ON public.voice_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_warnings_updated_at BEFORE UPDATE ON public.warnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 16. Enable Row Level Security (RLS) ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_category_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_events ENABLE ROW LEVEL SECURITY;

-- ── 17. RLS Policies (Own User Only) ──
CREATE POLICY select_own_profile ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY insert_own_profile ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY update_own_profile ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY delete_own_profile ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- budgets
CREATE POLICY select_own_budget ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_budget ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_budget ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_budget ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- categories
CREATE POLICY select_own_category ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_category ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_category ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_category ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- budget_category_limits
CREATE POLICY select_own_limit ON public.budget_category_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_limit ON public.budget_category_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_limit ON public.budget_category_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_limit ON public.budget_category_limits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- transactions
CREATE POLICY select_own_transaction ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_transaction ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_transaction ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_transaction ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- receipts
CREATE POLICY select_own_receipt ON public.receipts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_receipt ON public.receipts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_receipt ON public.receipts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_receipt ON public.receipts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- voice_entries
CREATE POLICY select_own_voice ON public.voice_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_voice ON public.voice_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_voice ON public.voice_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_voice ON public.voice_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- agent_messages
CREATE POLICY select_own_msg ON public.agent_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_msg ON public.agent_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_msg ON public.agent_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_msg ON public.agent_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- agent_actions
CREATE POLICY select_own_act ON public.agent_actions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_act ON public.agent_actions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_act ON public.agent_actions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_act ON public.agent_actions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reports
CREATE POLICY select_own_report ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_report ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_report ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_report ON public.reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- warnings
CREATE POLICY select_own_warning ON public.warnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_warning ON public.warnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_warning ON public.warnings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_warning ON public.warnings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- budget_events
CREATE POLICY select_own_event ON public.budget_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_own_event ON public.budget_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_event ON public.budget_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY delete_own_event ON public.budget_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 18. Default Category Seeding Logic ──
CREATE OR REPLACE FUNCTION get_or_create_category(
  p_user_id uuid,
  p_name text,
  p_type text,
  p_parent_id uuid,
  p_limit numeric,
  p_is_default boolean
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id 
  FROM public.categories 
  WHERE user_id = p_user_id 
    AND name = p_name 
    AND (
      (parent_category_id IS NULL AND p_parent_id IS NULL) 
      OR (parent_category_id = p_parent_id)
    );
    
  IF v_id IS NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_category_id, monthly_limit, ai_created, is_default)
    VALUES (p_user_id, p_name, p_type, p_parent_id, p_limit, false, p_is_default)
    RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_categories_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  food_id uuid;
  transport_id uuid;
  car_id uuid;
  bills_id uuid;
  subs_id uuid;
  income_id uuid;
BEGIN
  -- Food & Drinks
  food_id := get_or_create_category(target_user_id, 'Food & Drinks', 'expense', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Groceries', 'expense', food_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Restaurants', 'expense', food_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Delivery', 'expense', food_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Coffee', 'expense', food_id, 0, true);

  -- Transport
  transport_id := get_or_create_category(target_user_id, 'Transport', 'expense', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Bus', 'expense', transport_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Taxi', 'expense', transport_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Fuel', 'expense', transport_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Train', 'expense', transport_id, 0, true);

  -- Shopping
  PERFORM get_or_create_category(target_user_id, 'Shopping', 'expense', NULL, 0, true);

  -- Bills
  bills_id := get_or_create_category(target_user_id, 'Bills', 'expense', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Rent', 'expense', bills_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Phone', 'expense', bills_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Electricity', 'expense', bills_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Water', 'expense', bills_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Internet', 'expense', bills_id, 0, true);

  -- Subscriptions
  subs_id := get_or_create_category(target_user_id, 'Subscriptions', 'expense', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Streaming', 'expense', subs_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Software', 'expense', subs_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Apps', 'expense', subs_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Cloud services', 'expense', subs_id, 0, true);

  -- Health
  PERFORM get_or_create_category(target_user_id, 'Health', 'expense', NULL, 0, true);

  -- Education
  PERFORM get_or_create_category(target_user_id, 'Education', 'expense', NULL, 0, true);

  -- Entertainment
  PERFORM get_or_create_category(target_user_id, 'Entertainment', 'expense', NULL, 0, true);

  -- Car
  car_id := get_or_create_category(target_user_id, 'Car', 'expense', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Fuel', 'expense', car_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Maintenance', 'expense', car_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Parking', 'expense', car_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Insurance', 'expense', car_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Washing', 'expense', car_id, 0, true);

  -- Income
  income_id := get_or_create_category(target_user_id, 'Income', 'income', NULL, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Salary', 'income', income_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Gift', 'income', income_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Refund', 'income', income_id, 0, true);
  PERFORM get_or_create_category(target_user_id, 'Side income', 'income', income_id, 0, true);

  -- Savings
  PERFORM get_or_create_category(target_user_id, 'Savings', 'savings', NULL, 0, true);

  -- Other
  PERFORM get_or_create_category(target_user_id, 'Other', 'expense', NULL, 0, true);
END;
$$ LANGUAGE plpgsql;

-- ── 19. Initial Budget Creation Helper ──
CREATE OR REPLACE FUNCTION create_initial_budget_for_user(
  target_user_id uuid,
  p_name text DEFAULT 'Main Budget',
  p_currency text DEFAULT 'ILS',
  p_cycle_start_day integer DEFAULT 1,
  p_budget_style text DEFAULT 'balanced'
) RETURNS uuid AS $$
DECLARE
  v_budget_id uuid;
BEGIN
  SELECT id INTO v_budget_id FROM public.budgets WHERE user_id = target_user_id AND is_active = true LIMIT 1;
  
  IF v_budget_id IS NULL THEN
    INSERT INTO public.budgets (
      user_id,
      name,
      currency,
      cycle_start_day,
      budget_style,
      is_active
    ) VALUES (
      target_user_id,
      p_name,
      p_currency,
      p_cycle_start_day,
      p_budget_style,
      true
    ) RETURNING id INTO v_budget_id;
  END IF;
  
  RETURN v_budget_id;
END;
$$ LANGUAGE plpgsql;

-- ── 20. Trigger for Auth Signup mapping profiles ──
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    date_of_birth,
    preferred_language,
    currency,
    budget_style,
    onboarding_completed
  ) VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'first_name', ''),
    coalesce(NEW.raw_user_meta_data->>'last_name', ''),
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' <> ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL 
    END,
    coalesce(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    coalesce(NEW.raw_user_meta_data->>'currency', 'ILS'),
    coalesce(NEW.raw_user_meta_data->>'budget_style', 'balanced'),
    false
  );

  -- Also seed default categories immediately on signup
  PERFORM public.create_default_categories_for_user(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
